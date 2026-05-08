import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const SYSTEM_PROMPT = `You are a precise data extraction assistant for commercial documents (invoices, purchase orders, delivery notes).

Extract ALL line items and return ONLY a valid JSON array — no markdown, no explanation:
[
  {
    "codigo": "string or null",
    "articulo": "string",
    "cantidad": integer,
    "precio_sin_iva": float
  }
]

Rules:
- codigo: barcode number (EAN-13, EAN-8, or similar), numeric digits only. Set to null if the document does not explicitly show a barcode — do NOT use internal codes, SKUs, or references as barcodes.
- articulo: full product/service description in the document's original language.
- cantidad: positive integer. Round decimals if needed.
- precio_sin_iva: net unit price in Argentine pesos (ARS), without VAT. If the document shows price with VAT (IVA), divide: precio_sin_iva = precio_con_iva / (1 + tasa). Argentine IVA rates: 0.21 (general), 0.105 (reduced), 0.27 (special), 0.00 (exempt).
- Extract EVERY line item. Never skip any.
- Never fabricate data.
- If no products found, return [].`;

function parseItems(raw: string) {
  const cleaned = raw.replace(/```json\n?|```/g, "").trim();
  const parsed: unknown = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("Not an array");

  return (parsed as Record<string, unknown>[])
    .map((item) => ({
      codigo: item.codigo != null ? String(item.codigo) : null,
      articulo: String(item.articulo ?? ""),
      cantidad: Math.round(Number(item.cantidad) || 0),
      precio_sin_iva:
        Math.round(parseFloat(String(item.precio_sin_iva ?? "0")) * 100) / 100,
    }))
    .filter((i) => i.articulo.trim() !== "" && i.cantidad > 0);
}

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "GROQ_API_KEY no configurada en .env.local" },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato no soportado. Usa PDF, JPG o PNG." },
      { status: 400 }
    );
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "El archivo supera los 10 MB" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  try {
    let userContent: Groq.Chat.ChatCompletionMessageParam["content"];

    if (file.type === "application/pdf") {
      const pdfParse = (await import("pdf-parse")).default;
      const pdf = await pdfParse(buffer);
      const text = pdf.text.trim();

      if (!text) {
        return NextResponse.json(
          { error: "El PDF no contiene texto extraíble. Guárdalo como JPG o PNG e inténtalo de nuevo." },
          { status: 422 }
        );
      }

      userContent = `Extrae todos los artículos de este documento comercial:\n\n${text.slice(0, 12000)}`;
    } else {
      const base64 = buffer.toString("base64");
      const mimeType = file.type as "image/jpeg" | "image/png";

      userContent = [
        {
          type: "image_url" as const,
          image_url: { url: `data:${mimeType};base64,${base64}` },
        },
        {
          type: "text" as const,
          text: "Extrae todos los artículos de este documento comercial.",
        },
      ];
    }

    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0,
      max_tokens: 2048,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "[]";

    let items: ReturnType<typeof parseItems>;
    try {
      items = parseItems(raw);
    } catch {
      return NextResponse.json(
        { error: "El modelo no devolvió datos válidos. Intenta con una imagen más nítida." },
        { status: 500 }
      );
    }

    return NextResponse.json({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error interno del servidor";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
