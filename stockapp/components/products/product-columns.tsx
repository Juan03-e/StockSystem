"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Archive, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, getAlertLevel, ALERT_LEVEL_LABELS } from "@/lib/utils";
import type { Product } from "@/types";

const ALERT_BADGE: Record<string, { variant: "destructive" | "default" | "secondary"; label: string }> = {
  CRITICAL: { variant: "destructive", label: "Sin stock" },
  WARNING: { variant: "default", label: "Bajo mínimo" },
  OK: { variant: "secondary", label: "Normal" },
};

interface ColumnOptions {
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function productColumns({ canEdit, canDelete, onEdit, onDelete }: ColumnOptions): ColumnDef<Product>[] {
  return [
    {
      id: "name",
      accessorKey: "name",
      header: "Producto",
      enableSorting: true,
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            {p.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.imageUrl}
                alt={p.name}
                className="h-8 w-8 rounded object-cover shrink-0 border border-[hsl(var(--border))]"
              />
            ) : (
              <div className="h-8 w-8 rounded bg-[hsl(var(--muted))] flex items-center justify-center shrink-0">
                <Package className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium truncate">{p.name}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{p.sku}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: "category",
      accessorFn: (row) => row.category?.name ?? "",
      header: "Categoría",
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-sm text-[hsl(var(--muted-foreground))]">{getValue() as string}</span>
      ),
    },
    {
      id: "stock",
      accessorKey: "stock",
      header: "Stock",
      enableSorting: true,
      cell: ({ row }) => {
        const { stock, minStock, unit } = row.original;
        const level = getAlertLevel(stock, minStock);
        const info = ALERT_BADGE[level];
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium tabular-nums">
              {stock} {unit}
            </span>
            <Badge variant={info.variant} className="text-[10px] h-4 px-1.5">
              {info.label}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "minStock",
      accessorKey: "minStock",
      header: "Mín.",
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="text-sm text-[hsl(var(--muted-foreground))] tabular-nums">
          {getValue() as number}
        </span>
      ),
    },
    {
      id: "salePrice",
      accessorKey: "salePrice",
      header: "Precio venta",
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="tabular-nums">{formatCurrency(getValue() as number)}</span>
      ),
    },
    {
      id: "costPrice",
      accessorKey: "costPrice",
      header: "Costo",
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="tabular-nums text-[hsl(var(--muted-foreground))]">
          {formatCurrency(getValue() as number)}
        </span>
      ),
    },
    {
      id: "supplier",
      accessorKey: "supplier",
      header: "Proveedor",
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-sm text-[hsl(var(--muted-foreground))] truncate max-w-32 block">
          {(getValue() as string | null) ?? "—"}
        </span>
      ),
    },
    // Actions column (only shown if user has permissions)
    ...(canEdit || canDelete
      ? [
          {
            id: "actions",
            header: "",
            enableSorting: false,
            cell: ({ row }: { row: { original: Product } }) => {
              const product = row.original;
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Acciones</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEdit && (
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => onEdit(product)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer text-[hsl(var(--destructive))] focus:text-[hsl(var(--destructive))]"
                          onClick={() => onDelete(product)}
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archivar
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            },
          } as ColumnDef<Product>,
        ]
      : []),
  ];
}
