"use client";

import { useState } from "react";
import useSWR from "swr";
import { Download, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { exportToCsv } from "@/lib/csv-export";
import { ReportSummaryCards } from "./report-summary-cards";
import type { MovementReportResponse } from "@/app/api/reports/movements/route";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Props {
  defaultFrom: string;
  defaultTo: string;
}

const TYPE_OPTIONS = [
  { value: "", label: "Todos los tipos" },
  { value: "ENTRY", label: "Entradas" },
  { value: "EXIT", label: "Salidas" },
];

export function MovementsReport({ defaultFrom, defaultTo }: Props) {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [type, setType] = useState("");
  const [includeVoided, setIncludeVoided] = useState(false);

  const params = new URLSearchParams({ from, to });
  if (type) params.set("type", type);
  if (includeVoided) params.set("includeVoided", "true");

  const { data, isLoading, mutate } = useSWR<MovementReportResponse>(
    `/api/reports/movements?${params}`,
    fetcher
  );

  function handleExport() {
    if (!data?.rows.length) return;
    const rows = data.rows.map((r) => ({
      Fecha: formatDateTime(r.date),
      SKU: r.productSku,
      Producto: r.productName,
      Categoría: r.category,
      Tipo: r.type === "ENTRY" ? "Entrada" : "Salida",
      Motivo: r.reason,
      Cantidad: r.quantity,
      "Costo unitario": r.unitCost ?? "",
      "Costo total": r.totalCost ?? "",
      Usuario: r.userName,
      Notas: r.notes ?? "",
      Anulado: r.isVoided ? "Sí" : "No",
    }));
    exportToCsv(`movimientos_${from}_${to}.csv`, rows);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <DateRangePicker from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] cursor-pointer"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={includeVoided}
            onChange={(e) => setIncludeVoided(e.target.checked)}
            className="rounded"
          />
          Incluir anulados
        </label>
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
            { label: "Total movimientos", value: data.summary.totalMovements, color: "blue" },
            { label: "Entradas", value: data.summary.totalEntries, color: "green" },
            { label: "Salidas", value: data.summary.totalExits, color: "red" },
            { label: "Anulados", value: data.summary.totalVoided, color: data.summary.totalVoided > 0 ? "amber" : "green" },
          ]}
        />
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-[hsl(var(--muted)/0.5)]">
              <th className="px-3 py-2.5 text-left font-medium">Fecha</th>
              <th className="px-3 py-2.5 text-left font-medium">Producto</th>
              <th className="px-3 py-2.5 text-left font-medium">Categoría</th>
              <th className="px-3 py-2.5 text-left font-medium">Tipo</th>
              <th className="px-3 py-2.5 text-left font-medium">Motivo</th>
              <th className="px-3 py-2.5 text-right font-medium">Cantidad</th>
              <th className="px-3 py-2.5 text-right font-medium">Costo total</th>
              <th className="px-3 py-2.5 text-left font-medium">Usuario</th>
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
                  Sin movimientos en el período seleccionado
                </td>
              </tr>
            ) : (
              data.rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b transition-colors ${
                    row.isVoided
                      ? "opacity-50 line-through"
                      : "hover:bg-[hsl(var(--muted)/0.3)]"
                  }`}
                >
                  <td className="px-3 py-2 text-xs text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                    {formatDateTime(row.date)}
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-medium">{row.productName}</span>
                    <span className="ml-1 text-xs text-[hsl(var(--muted-foreground))]">{row.productSku}</span>
                  </td>
                  <td className="px-3 py-2 text-[hsl(var(--muted-foreground))]">{row.category}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.type === "ENTRY"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {row.type === "ENTRY" ? "Entrada" : "Salida"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[hsl(var(--muted-foreground))]">{row.reason}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">
                    <span className={row.type === "ENTRY" ? "text-emerald-600" : "text-red-600"}>
                      {row.type === "ENTRY" ? "+" : "-"}{row.quantity}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {row.totalCost ? formatCurrency(row.totalCost) : "—"}
                  </td>
                  <td className="px-3 py-2 text-[hsl(var(--muted-foreground))]">{row.userName}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
