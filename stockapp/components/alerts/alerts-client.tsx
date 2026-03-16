"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  AlertTriangle, XCircle, CheckCircle2, RefreshCw,
  PackagePlus, Box, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { MovementFormDialog } from "@/components/movements/movement-form-dialog";
import { toast } from "sonner";
import type { Role } from "@/types";
import type { AlertProduct } from "@/app/api/alerts/route";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AlertsResponse {
  alerts: AlertProduct[];
  summary: { total: number; critical: number; warning: number };
}

interface AlertsClientProps {
  userRole: Role;
}

export function AlertsClient({ userRole }: AlertsClientProps) {
  const [restockProductId, setRestockProductId] = useState<string | null>(null);
  const { data, isLoading, mutate } = useSWR<AlertsResponse>("/api/alerts", fetcher, {
    refreshInterval: 60_000,
  });

  const summary = data?.summary ?? { total: 0, critical: 0, warning: 0 };
  const alerts = data?.alerts ?? [];

  return (
    <div className="space-y-6">
      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total alertas"
          value={isLoading ? null : summary.total}
          icon={<Box className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          label="Críticos (sin stock)"
          value={isLoading ? null : summary.critical}
          icon={<XCircle className="h-5 w-5" />}
          color="red"
        />
        <StatCard
          label="Bajo mínimo"
          value={isLoading ? null : summary.warning}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="amber"
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {isLoading ? "Cargando..." : `${summary.total} producto(s) necesitan atención`}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 cursor-pointer"
          onClick={() => mutate()}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Actualizar
        </Button>
      </div>

      {/* Alert list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[hsl(var(--border))] py-16 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
          <h3 className="text-lg font-semibold">Todo en orden</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            No hay productos con stock crítico o bajo mínimo.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              onRestock={() => setRestockProductId(alert.id)}
            />
          ))}
        </div>
      )}

      {/* Restock dialog */}
      <MovementFormDialog
        open={!!restockProductId}
        preselectedProductId={restockProductId ?? undefined}
        onClose={() => setRestockProductId(null)}
        onSuccess={() => {
          mutate();
          toast.success("Reposición registrada");
        }}
      />
    </div>
  );
}

// ─── Alert Row ────────────────────────────────────────────────────────────────

function AlertRow({
  alert,
  onRestock,
}: {
  alert: AlertProduct;
  onRestock: () => void;
}) {
  const isCritical = alert.alertLevel === "CRITICAL";
  const stockPercent = alert.minStock > 0
    ? Math.min(100, Math.round((alert.stock / alert.minStock) * 100))
    : 0;

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg border p-4 transition-colors",
        isCritical
          ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10"
          : "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/10"
      )}
    >
      {/* Level icon */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          isCritical ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"
        )}
      >
        {isCritical ? (
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        )}
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm truncate">{alert.name}</span>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">{alert.sku}</span>
          {alert.category && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
              {alert.category.name}
            </Badge>
          )}
          <Badge
            className={cn(
              "text-[10px] h-4 px-1.5",
              isCritical
                ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
            )}
          >
            {isCritical ? "Sin stock" : "Bajo mínimo"}
          </Badge>
        </div>

        <div className="mt-2 flex items-center gap-4">
          {/* Stock bar */}
          <div className="flex items-center gap-2 min-w-0 flex-1 max-w-48">
            <Progress
              value={stockPercent}
              className={cn(
                "h-1.5 flex-1",
                isCritical ? "[&>div]:bg-red-500" : "[&>div]:bg-amber-500"
              )}
            />
            <span className="text-xs text-[hsl(var(--muted-foreground))] whitespace-nowrap tabular-nums">
              {alert.stock} / {alert.minStock} {alert.unit}
            </span>
          </div>

          {/* Supplier */}
          {alert.supplier && (
            <span className="text-xs text-[hsl(var(--muted-foreground))] hidden sm:block truncate max-w-32">
              {alert.supplier}
            </span>
          )}

          {/* Value at risk */}
          <span className="text-xs text-[hsl(var(--muted-foreground))] hidden md:block whitespace-nowrap">
            Costo:{" "}
            <span className="font-medium text-[hsl(var(--foreground))]">
              {formatCurrency(alert.costPrice * alert.stock)}
            </span>
          </span>
        </div>
      </div>

      {/* Quick restock CTA */}
      <Button
        size="sm"
        variant={isCritical ? "default" : "outline"}
        className={cn(
          "shrink-0 gap-1.5 cursor-pointer whitespace-nowrap",
          isCritical && "bg-red-600 hover:bg-red-700 text-white border-0"
        )}
        onClick={onRestock}
      >
        <PackagePlus className="h-3.5 w-3.5" />
        Reponer
      </Button>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

const COLOR_MAP = {
  blue:  { bg: "bg-blue-50 dark:bg-blue-900/20",   icon: "text-blue-600 dark:text-blue-400",   value: "text-blue-700 dark:text-blue-300"  },
  red:   { bg: "bg-red-50 dark:bg-red-900/20",     icon: "text-red-600 dark:text-red-400",     value: "text-red-700 dark:text-red-300"    },
  amber: { bg: "bg-amber-50 dark:bg-amber-900/20", icon: "text-amber-600 dark:text-amber-400", value: "text-amber-700 dark:text-amber-300" },
} as const;

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number | null;
  icon: React.ReactNode;
  color: keyof typeof COLOR_MAP;
}) {
  const c = COLOR_MAP[color];
  return (
    <div className={cn("kpi-card flex items-center gap-4", c.bg)}>
      <div className={cn("shrink-0", c.icon)}>{icon}</div>
      <div>
        {value === null ? (
          <Skeleton className="h-7 w-12 mb-1" />
        ) : (
          <p className={cn("text-2xl font-bold tabular-nums", c.value)}>{value}</p>
        )}
        <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
      </div>
    </div>
  );
}
