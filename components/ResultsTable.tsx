import { LineItem } from "@/app/page";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  items: LineItem[];
}

export function ResultsTable({ items }: Props) {
  return (
    <div className="space-y-2">
      {/* Mobile: card list */}
      <div className="md:hidden space-y-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-sm"
          >
            <div className="flex justify-between items-start gap-3">
              <p className="font-medium text-slate-900 text-sm leading-snug flex-1">
                {item.articulo}
              </p>
              <p className="font-semibold text-slate-900 text-sm shrink-0 tabular-nums">
                $ {(item.cantidad * item.precio_sin_iva).toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 tabular-nums">
              {item.codigo && (
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                  {item.codigo}
                </span>
              )}
              <span>{item.cantidad} u. × $ {item.precio_sin_iva.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="w-36 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Cód. Barras
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Artículo
              </TableHead>
              <TableHead className="text-right w-20 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Cant.
              </TableHead>
              <TableHead className="text-right w-36 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Precio s/IVA
              </TableHead>
              <TableHead className="text-right w-36 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Subtotal
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={idx} className="hover:bg-slate-50/60">
                <TableCell className="font-mono text-xs text-slate-400">
                  {item.codigo ?? ""}
                </TableCell>
                <TableCell className="font-medium text-slate-800">{item.articulo}</TableCell>
                <TableCell className="text-right tabular-nums text-slate-600">
                  {item.cantidad}
                </TableCell>
                <TableCell className="text-right tabular-nums text-slate-600">
                  $ {item.precio_sin_iva.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right tabular-nums font-semibold text-slate-900">
                  $ {(item.cantidad * item.precio_sin_iva).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
