"use client";

import { useState } from "react";
import { format, subDays } from "date-fns";
import { FileText, Package, ArrowLeftRight, AlertTriangle, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { StockReport } from "./stock-report";
import { MovementsReport } from "./movements-report";
import { LowStockReport } from "./low-stock-report";

type Tab = "stock" | "movements" | "lowstock";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "stock", label: "Inventario actual", icon: <Package className="h-4 w-4" /> },
  { id: "movements", label: "Movimientos", icon: <ArrowLeftRight className="h-4 w-4" /> },
  { id: "lowstock", label: "Stock bajo mínimo", icon: <AlertTriangle className="h-4 w-4" /> },
];

export function ReportsClient() {
  const [activeTab, setActiveTab] = useState<Tab>("stock");

  const defaultFrom = format(subDays(new Date(), 29), "yyyy-MM-dd");
  const defaultTo = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[hsl(var(--primary))]" />
          <div>
            <h1 className="text-xl font-semibold">Reportes</h1>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Exporta y analiza datos de inventario
            </p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-[hsl(var(--muted))] transition-colors"
        >
          <Printer className="h-4 w-4" />
          Imprimir
        </button>
      </div>

      {/* Print header (only visible on print) */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">StockSystem — Reporte</h1>
        <p className="text-sm text-gray-500">
          Generado el {format(new Date(), "dd/MM/yyyy HH:mm")}
        </p>
        <hr className="my-2" />
      </div>

      {/* Tabs */}
      <div className="border-b print:hidden">
        <nav className="-mb-px flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
                  : "border-transparent text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "stock" && <StockReport />}
        {activeTab === "movements" && (
          <MovementsReport defaultFrom={defaultFrom} defaultTo={defaultTo} />
        )}
        {activeTab === "lowstock" && <LowStockReport />}
      </div>
    </div>
  );
}
