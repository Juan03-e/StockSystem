"use client";

import useSWR from "swr";
import { Download, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { exportToCsv } from "@/lib/csv-export";
import { ReportSummaryCards } from "./report-summary-cards";
import { AlertBadgeInline } from "./alert-badge-inline";
import type { LowStockReportResponse } from "@/app/api/reports/low-stock/route";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function LowStockReport() {
  const { data, isLoading, mutate } = useSWR<LowStockReportResponse>(
    "/api/reports/low-stock",
    fetcher
  );

  function handleExport() {
    if (!data?.rows.length) return;
    const rows = data.rows.map((r) => ({
      SKU: r.sku,
      Producto: r.name,
      Categoría: r.category,
      "Stock actual": r.stock,
      "Stock mínimo": r.minStock,
      Déficit: r.deficit,
      Unidad: r.unit,
      "Costo unitario": r.costPrice ?? "",
      "Costo reposición": r.reorderCost ?? "",
      Proveedor: r.supplier ?? "",
      Alerta: r.alertLevel,
    }));
    exportToCsv(`stock_bajo_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 print:hidden">
        <button
          onClick={() => mutate()}
          className="rounded-md border p-1.5 hover:bg-[hsl(var(--muted))] transition-colors"
          title="Actualizar"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <button
          onClick={handleExport}
          disabled={!data?.rows.length}
          className="flex items-center gap-1.5 rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </button>
        <p className="ml-auto text-xs text-[hsl(var(--muted-foreground))]">
          Productos no archivados con stock ≤ mínimo
        </p>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : data?.summary && (
        <ReportSummaryCards
          cards={[
            { label: "Total alertas", value: data.summary.totalAlerts, color: data.summary.totalAlerts > 0 ? "amber" : "green" },
            { label: "Sin stock (crítico)", value: data.summary.criticalCount, color: data.summary.criticalCount > 0 ? "red" : "green" },
            { label: "Stock bajo", value: data.summary.warningCount, color: data.summary.warningCount > 0 ? "amber" : "green" },
            { label: "Costo reposición", value: formatCurrency(data.summary.totalReorderCost), color: "indigo" },
          ]}
        />
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-[hsl(var(--muted)/0.5)]">
              <th className="px-3 py-2.5 text-left font-medium">SKU</th>
              <th className="px-3 py-2.5 text-left font-medium">Producto</th>
              <th className="px-3 py-2.5 text-left font-medium">Categoría</th>
              <th className="px-3 py-2.5 text-right font-medium">Stock actual</th>
              <th className="px-3 py-2.5 text-right font-medium">Mínimo</th>
              <th className="px-3 py-2.5 text-right font-medium">Déficit</th>
              <th className="px-3 py-2.5 text-right font-medium">Costo reposición</th>
              <th className="px-3 py-2.5 text-left font-medium">Proveedor</th>
              <th className="px-3 py-2.5 text-left font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 9 }).map((__, j) => (
                    <td key={j} className="px-3 py-2"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : !data?.rows.length ? (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center">
                  <div className="flex flex-col items-center gap-2 text-[hsl(var(--muted-foreground))]">
                    <span className="text-3xl">✅</span>
                    <span>Todos los productos tienen stock suficiente</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b hover:bg-[hsl(var(--muted)/0.3)] transition-colors ${
                    row.alertLevel === "CRITICAL"
                      ? "bg-red-50/50 dark:bg-red-900/10"
                      : "bg-amber-50/50 dark:bg-amber-900/10"
                  }`}
                >
                  <td className="px-3 py-2 font-mono text-xs text-[hsl(var(--muted-foreground))]">{row.sku}</td>
                  <td className="px-3 py-2 font-medium">{row.name}</td>
                  <td className="px-3 py-2 text-[hsl(var(--muted-foreground))]">{row.category}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold text-red-600">{row.stock}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-[hsl(var(--muted-foreground))]">{row.minStock}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium text-red-600">
                    {row.deficit > 0 ? `-${row.deficit}` : "0"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {row.reorderCost ? formatCurrency(row.reorderCost) : "—"}
                  </td>
                  <td className="px-3 py-2 text-[hsl(var(--muted-foreground))]">{row.supplier ?? "—"}</td>
                  <td className="px-3 py-2"><AlertBadgeInline level={row.alertLevel} /></td>
                </tr>
              ))
            )}
          </tbody>
          {data?.rows.length ? (
            <tfoot>
              <tr className="border-t bg-[hsl(var(--muted)/0.5)]">
                <td colSpan={6} className="px-3 py-2 text-sm font-semibold">
                  Total ({data.rows.length} productos en alerta)
                </td>
                <td className="px-3 py-2 text-right font-bold tabular-nums">
                  {formatCurrency(data.summary.totalReorderCost)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  );
}
