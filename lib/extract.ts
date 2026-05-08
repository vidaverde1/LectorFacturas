"use client";

import Groq from "groq-sdk";
import type { LineItem } from "./types";

const MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const STORAGE_KEY = "groq_api_key";

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
- codigo: barcode number (EAN-13, EAN-8, or similar), numeric digits only. Set to null if not explicitly shown as a barcode.
- articulo: full product/service description in the document's original language.
- cantidad: positive integer. Round decimals if needed.
- precio_sin_iva: net unit price in Argentine pesos (ARS), without VAT. If price includes VAT, divide: precio_sin_iva = precio_con_iva / (1 + tasa). Argentine IVA rates: 0.21, 0.105, 0.27, 0.00.
- Extract EVERY line item. Never skip any. Never fabricate data.
- If no products found, return [].`;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function parseItems(raw: string): LineItem[] {
  const cleaned = raw.replace(/```json\n?|```/g, "").trim();
  const parsed: unknown = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("Not an array");
  return (parsed as Record<string, unknown>[])
    .map((item) => ({
      codigo: item.codigo != null ? String(item.codigo) : null,
      articulo: String(item.articulo ?? ""),
      cantidad: Math.round(Number(item.cantidad) || 0),
      precio_sin_iva: Math.round(parseFloat(String(item.precio_sin_iva ?? "0")) * 100) / 100,
    }))
    .filter((i) => i.articulo.trim() !== "" && i.cantidad > 0);
}

export function getSavedApiKey(): string {
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

export function saveApiKey(key: string) {
  localStorage.setItem(STORAGE_KEY, key.trim());
}

export function clearApiKey() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function extractItems(file: File): Promise<LineItem[]> {
  const apiKey = getSavedApiKey();
  if (!apiKey) throw new Error("NO_API_KEY");

  if (file.type === "application/pdf") {
    throw new Error("PDF no soportado. Guardá el documento como JPG o PNG.");
  }

  const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  const base64 = await fileToBase64(file);

  const completion = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0,
    max_tokens: 2048,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:${file.type};base64,${base64}` } },
          { type: "text", text: "Extrae todos los artículos de este documento comercial." },
        ],
      },
    ],
  });

  return parseItems(completion.choices[0]?.message?.content ?? "[]");
}
