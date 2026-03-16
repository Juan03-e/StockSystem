"use client";

import { useState } from "react";
import useSWR from "swr";
import { Download, Search, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { exportToCsv } from "@/lib/csv-export";
import { ReportSummaryCards } from "./report-summary-cards";
import { AlertBadgeInline } from "./alert-badge-inline";
import type { StockReportResponse } from "@/app/api/reports/stock/route";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ALERT_OPTIONS = [
  { value: "", label: "Todos los productos" },
  { value: "CRITICAL", label: "Sin stock" },
  { value: "WARNING", label: "Stock bajo" },
  { value: "OK", label: "Stock normal" },
];

export function StockReport() {
  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState("");

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (alert) params.set("alert", alert);

  const { data, isLoading, mutate } = useSWR<StockReportResponse>(
    `/api/reports/stock?${params}`,
    fetcher
  );

  function handleExport() {
    if (!data?.rows.length) return;
    const rows = data.rows.map((r) => ({
      SKU: r.sku,
      Producto: r.name,
      Categoría: r.category,
      Stock: r.stock,
      "Stock mínimo": r.minStock,
      Unidad: r.unit,
      "Costo unitario": r.costPrice ?? "",
      "Precio venta": r.salePrice ?? "",
      "Valor total": r.totalValue,
      Proveedor: r.supplier ?? "",
      Alerta: r.alertLevel,
    }));
    exportToCsv(`inventario_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Buscar producto o SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-transparent pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          />
        </div>
        <select
          value={alert}
          onChange={(e) => setAlert(e.target.value)}
          className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] cursor-pointer"
        >
          {ALERT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
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
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : data?.summary && (
        <ReportSummaryCards
          cards={[
            { label: "Total productos", value: data.summary.totalProducts, color: "blue" },
            { label: "Valor inventario", value: formatCurrency(data.summary.totalValue), color: "indigo" },
            { label: "Sin stock", value: data.summary.criticalCount, color: data.summary.criticalCount > 0 ? "red" : "green" },
            { label: "Stock bajo", value: data.summary.warningCount, color: data.summary.warningCount > 0 ? "amber" : "green" },
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
              <th className="px-3 py-2.5 text-right font-medium">Stock</th>
              <th className="px-3 py-2.5 text-right font-medium">Mínimo</th>
              <th className="px-3 py-2.5 text-right font-medium">Costo unit.</th>
              <th className="px-3 py-2.5 text-right font-medium">Valor total</th>
              <th className="px-3 py-2.5 text-left font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-3 py-2"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : !data?.rows.length ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-[hsl(var(--muted-foreground))]">
                  Sin resultados
                </td>
              </tr>
            ) : (
              data.rows.map((row) => (
                <tr key={row.id} className="border-b hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                  <td className="px-3 py-2 font-mono text-xs text-[hsl(var(--muted-foreground))]">{row.sku}</td>
                  <td className="px-3 py-2 font-medium">{row.name}</td>
                  <td className="px-3 py-2 text-[hsl(var(--muted-foreground))]">{row.category}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.stock}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-[hsl(var(--muted-foreground))]">{row.minStock}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.costPrice ? formatCurrency(row.costPrice) : "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">{formatCurrency(row.totalValue)}</td>
                  <td className="px-3 py-2"><AlertBadgeInline level={row.alertLevel} /></td>
                </tr>
              ))
            )}
          </tbody>
          {data?.rows.length ? (
            <tfoot>
              <tr className="border-t bg-[hsl(var(--muted)/0.5)]">
                <td colSpan={6} className="px-3 py-2 text-sm font-semibold">
                  Total ({data.rows.length} productos)
                </td>
                <td className="px-3 py-2 text-right font-bold tabular-nums">
                  {formatCurrency(data.summary.totalValue)}
                </td>
                <td />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  );
}
