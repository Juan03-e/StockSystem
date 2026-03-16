"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTime, MOVEMENT_TYPE_LABELS, MOVEMENT_REASON_LABELS } from "@/lib/utils";
import type { Movement } from "@/types";
import { cn } from "@/lib/utils";

interface ColumnOptions {
  isAdmin: boolean;
  onVoid: (movement: Movement) => void;
}

export function movementColumns({ isAdmin, onVoid }: ColumnOptions): ColumnDef<Movement>[] {
  return [
    {
      id: "date",
      accessorKey: "date",
      header: "Fecha",
      enableSorting: true,
      cell: ({ row }) => {
        const { date, isVoided } = row.original;
        return (
          <span className={cn("text-sm tabular-nums", isVoided && "line-through text-[hsl(var(--muted-foreground))]")}>
            {formatDateTime(date)}
          </span>
        );
      },
    },
    {
      id: "product",
      header: "Producto",
      enableSorting: false,
      cell: ({ row }) => {
        const { product, isVoided } = row.original;
        return (
          <div className={cn("min-w-0", isVoided && "opacity-60")}>
            <p className="font-medium truncate text-sm">{product?.name ?? "—"}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{product?.sku}</p>
          </div>
        );
      },
    },
    {
      id: "type",
      accessorKey: "type",
      header: "Tipo",
      enableSorting: true,
      cell: ({ row }) => {
        const { type, isVoided } = row.original;
        return (
          <Badge
            variant={type === "ENTRY" ? "default" : "destructive"}
            className={cn(
              "text-[10px] font-semibold",
              type === "ENTRY" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
              isVoided && "opacity-50"
            )}
          >
            {MOVEMENT_TYPE_LABELS[type]}
          </Badge>
        );
      },
    },
    {
      id: "reason",
      accessorKey: "reason",
      header: "Motivo",
      enableSorting: false,
      cell: ({ row }) => {
        const { reason, isVoided } = row.original;
        return (
          <span className={cn("text-sm text-[hsl(var(--muted-foreground))]", isVoided && "opacity-60")}>
            {MOVEMENT_REASON_LABELS[reason]}
          </span>
        );
      },
    },
    {
      id: "quantity",
      accessorKey: "quantity",
      header: "Cantidad",
      enableSorting: true,
      cell: ({ row }) => {
        const { quantity, type, product, isVoided } = row.original;
        const sign = type === "ENTRY" ? "+" : "-";
        return (
          <span
            className={cn(
              "font-semibold tabular-nums",
              type === "ENTRY" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500",
              isVoided && "line-through opacity-50"
            )}
          >
            {sign}{quantity} {product?.unit}
          </span>
        );
      },
    },
    {
      id: "user",
      header: "Usuario",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm text-[hsl(var(--muted-foreground))]">
          {row.original.user?.name ?? "—"}
        </span>
      ),
    },
    {
      id: "notes",
      accessorKey: "notes",
      header: "Notas",
      enableSorting: false,
      cell: ({ row }) => {
        const { notes, isVoided, voidReason } = row.original;
        const displayText = isVoided && voidReason ? `[ANULADO] ${voidReason}` : notes;
        return (
          <span className={cn(
            "text-xs text-[hsl(var(--muted-foreground))] truncate max-w-40 block",
            isVoided && "text-[hsl(var(--destructive))] opacity-70"
          )}>
            {displayText ?? "—"}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const movement = row.original;

        if (movement.isVoided) {
          return (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="secondary" className="text-[10px] opacity-70">Anulado</Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Por: {movement.voidedBy?.name}</p>
                <p className="text-xs">{movement.voidReason}</p>
              </TooltipContent>
            </Tooltip>
          );
        }

        if (!isAdmin) return null;

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 cursor-pointer text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"
                onClick={() => onVoid(movement)}
                aria-label="Anular movimiento"
              >
                <Ban className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Anular movimiento</TooltipContent>
          </Tooltip>
        );
      },
    },
  ];
}
