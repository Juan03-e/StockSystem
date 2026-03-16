"use client";

import { useState } from "react";
import useSWR from "swr";
import { format, subDays } from "date-fns";
import { Box, AlertTriangle, DollarSign, Activity, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { StockByCategoryChart } from "@/components/charts/stock-by-category-chart";
import { MovementTrendChart } from "@/components/charts/movement-trend-chart";
import { TopProductsChart } from "@/components/charts/top-products-chart";
import { ValueDistributionChart } from "@/components/charts/value-distribution-chart";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface DashboardData {
  kpis: {
    totalProducts: number;
    lowStockCount: number;
    criticalCount: number;
    totalInventoryValue: number;
    movementsToday: number;
    movementsThisMonth: number;
  };
  charts: {
    stockByCategory: { name: string; totalStock: number; totalValue: number }[];
    movementTrend: { date: string; entries: number; exits: number }[];
    topProducts: { productId: string; name: string; totalMoved: number }[];
    valueByCategory: { name: string; value: number }[];
  };
  range: { from: string; to: string };
}

export function DashboardClient() {
  const defaultFrom = format(subDays(new Date(), 29), "yyyy-MM-dd");
  const defaultTo = format(new Date(), "yyyy-MM-dd");

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  const params = new URLSearchParams({ from, to });
  const { data, isLoading } = useSWR<DashboardData>(
    `/api/dashboard?${params}`,
    fetcher,
    { refreshInterval: 120_000 }
  );

  return (
    <div className="space-y-6">
      {/* Date range */}
      <DateRangePicker
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total productos"
          value={isLoading ? null : (data?.kpis.totalProducts ?? null)}
          icon={<Box className="h-5 w-5" />}
          color="blue"
          sub={isLoading ? null : `${data?.kpis.criticalCount ?? 0} sin stock`}
        />
        <KpiCard
          label="Stock bajo mínimo"
          value={isLoading ? null : (data?.kpis.lowStockCount ?? null)}
          icon={<AlertTriangle className="h-5 w-5" />}
          color={!isLoading && (data?.kpis.lowStockCount ?? 0) > 0 ? "red" : "green"}
          sub={isLoading ? null : "productos en alerta"}
        />
        <KpiCard
          label="Valor del inventario"
          value={isLoading ? null : formatCurrency(data?.kpis.totalInventoryValue ?? 0)}
          icon={<DollarSign className="h-5 w-5" />}
          color="indigo"
          sub={isLoading ? null : "costo total"}
          isText
        />
        <KpiCard
          label="Movimientos hoy"
          value={isLoading ? null : (data?.kpis.movementsToday ?? null)}
          icon={<Activity className="h-5 w-5" />}
          color="purple"
          sub={isLoading ? null : `${data?.kpis.movementsThisMonth ?? 0} en el período`}
        />
      </div>

      {/* Charts row 1: Stock by Category + Movement Trend */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <ChartCard title="Stock por categoría" className="lg:col-span-2">
          <StockByCategoryChart data={data?.charts.stockByCategory ?? []} isLoading={isLoading} />
        </ChartCard>
        <ChartCard title="Tendencia de movimientos" subtitle={`${from} → ${to}`} className="lg:col-span-3">
          <MovementTrendChart data={data?.charts.movementTrend ?? []} isLoading={isLoading} />
        </ChartCard>
      </div>

      {/* Charts row 2: Top Products + Value Distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <ChartCard title="Top 10 productos más movidos" className="lg:col-span-3">
          <TopProductsChart data={data?.charts.topProducts ?? []} isLoading={isLoading} />
        </ChartCard>
        <ChartCard title="Distribución de valor por categoría" className="lg:col-span-2">
          <ValueDistributionChart data={data?.charts.valueByCategory ?? []} isLoading={isLoading} />
        </ChartCard>
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

const KPI_COLORS = {
  blue:   { bg: "bg-blue-50 dark:bg-blue-900/20",   icon: "text-blue-500",   value: "text-blue-700 dark:text-blue-300"   },
  red:    { bg: "bg-red-50 dark:bg-red-900/20",     icon: "text-red-500",    value: "text-red-700 dark:text-red-300"     },
  green:  { bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: "text-emerald-500", value: "text-emerald-700 dark:text-emerald-300" },
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-900/20", icon: "text-indigo-500", value: "text-indigo-700 dark:text-indigo-300" },
  purple: { bg: "bg-purple-50 dark:bg-purple-900/20", icon: "text-purple-500", value: "text-purple-700 dark:text-purple-300" },
} as const;

function KpiCard({
  label, value, icon, color, sub, isText = false,
}: {
  label: string;
  value: number | string | null;
  icon: React.ReactNode;
  color: keyof typeof KPI_COLORS;
  sub: string | null;
  isText?: boolean;
}) {
  const c = KPI_COLORS[color];
  return (
    <div className="kpi-card space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
          {label}
        </p>
        <div className={cn("rounded-md p-1.5", c.bg)}>
          <span className={c.icon}>{icon}</span>
        </div>
      </div>
      {value === null ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <p className={cn("font-bold tabular-nums leading-none", isText ? "text-xl" : "text-3xl", c.value)}>
          {value}
        </p>
      )}
      {sub === null ? (
        <Skeleton className="h-3 w-20" />
      ) : (
        <p className="text-xs text-[hsl(var(--muted-foreground))]">{sub}</p>
      )}
    </div>
  );
}

// ─── Chart Card wrapper ───────────────────────────────────────────────────────

function ChartCard({
  title, subtitle, children, className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("kpi-card space-y-4", className)}>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
