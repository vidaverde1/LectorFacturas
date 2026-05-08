import * as XLSX from "xlsx";
import type { LineItem } from "@/app/page";

export function downloadExcel(items: LineItem[], sourceFile: string) {
  const rows = items.map((item) => ({
    Código: item.codigo ?? "",
    Artículo: item.articulo,
    Cantidad: item.cantidad,
    "Precio sin IVA": item.precio_sin_iva,
    Subtotal: Math.round(item.cantidad * item.precio_sin_iva * 100) / 100,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [{ wch: 15 }, { wch: 45 }, { wch: 10 }, { wch: 16 }, { wch: 14 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Artículos");

  const baseName = sourceFile.replace(/\.[^.]+$/, "");
  XLSX.writeFile(wb, `${baseName}_extraccion.xlsx`);
}
