"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, TrendingUp, TrendingDown, Search } from "lucide-react";
import useSWR from "swr";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { movementSchema, type MovementInput } from "@/lib/validations";
import { getAlertLevel } from "@/lib/utils";
import type { Product, PaginatedResponse } from "@/types";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ENTRY_REASONS = [
  { value: "PURCHASE", label: "Compra" },
  { value: "RETURN", label: "Devolución de cliente" },
] as const;

const EXIT_REASONS = [
  { value: "SALE", label: "Venta" },
  { value: "LOSS", label: "Pérdida / merma" },
  { value: "ADJUSTMENT", label: "Ajuste de inventario" },
] as const;

interface MovementFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Pre-select a product (e.g. from alerts page) */
  preselectedProductId?: string;
}

export function MovementFormDialog({
  open, onClose, onSuccess, preselectedProductId,
}: MovementFormDialogProps) {
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductList, setShowProductList] = useState(false);

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<MovementInput>({
    resolver: zodResolver(movementSchema),
    defaultValues: { type: "EXIT", reason: "SALE", quantity: 1 },
  });

  const movementType = watch("type");
  const quantity = watch("quantity") ?? 0;

  // Product search
  const searchParams = productSearch
    ? `?search=${encodeURIComponent(productSearch)}&pageSize=8&archived=false`
    : "?pageSize=8&archived=false";

  const { data: productsData } = useSWR<PaginatedResponse<Product>>(
    showProductList ? `/api/products${searchParams}` : null,
    fetcher
  );

  // Load preselected product
  useEffect(() => {
    if (preselectedProductId && open) {
      fetch(`/api/products/${preselectedProductId}`)
        .then((r) => r.json())
        .then((p: Product) => {
          setSelectedProduct(p);
          setValue("productId", p.id, { shouldValidate: true });
          setValue("type", "ENTRY");
          setValue("reason", "PURCHASE");
        });
    }
  }, [preselectedProductId, open, setValue]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      reset({ type: "EXIT", reason: "SALE", quantity: 1 });
      setSelectedProduct(null);
      setProductSearch("");
      setShowProductList(false);
    }
  }, [open, reset]);

  function selectProduct(p: Product) {
    setSelectedProduct(p);
    setValue("productId", p.id, { shouldValidate: true });
    setShowProductList(false);
    setProductSearch("");
  }

  async function onSubmit(data: MovementInput) {
    const res = await fetch("/api/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json() as { error: string };
      toast.error(err.error);
      return;
    }

    onSuccess();
    onClose();
  }

  // Stock preview after movement
  const stockAfter = selectedProduct
    ? movementType === "ENTRY"
      ? selectedProduct.stock + (quantity || 0)
      : selectedProduct.stock - (quantity || 0)
    : null;

  const alertAfter = selectedProduct && stockAfter !== null
    ? getAlertLevel(stockAfter, selectedProduct.minStock)
    : null;

  const reasons = movementType === "ENTRY" ? ENTRY_REASONS : EXIT_REASONS;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo movimiento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Movement type */}
          <div className="grid grid-cols-2 gap-2">
            {(["ENTRY", "EXIT"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setValue("type", t, { shouldValidate: true });
                  // Reset reason when type changes
                  setValue("reason", t === "ENTRY" ? "PURCHASE" : "SALE", { shouldValidate: true });
                }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md border p-3 text-sm font-medium transition-colors cursor-pointer",
                  movementType === t
                    ? t === "ENTRY"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
                )}
              >
                {t === "ENTRY" ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {t === "ENTRY" ? "Entrada" : "Salida"}
              </button>
            ))}
          </div>

          {/* Product selector */}
          <div className="space-y-1.5">
            <Label>Producto *</Label>
            {selectedProduct ? (
              <div className="flex items-center justify-between gap-2 rounded-md border border-[hsl(var(--border))] px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{selectedProduct.name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {selectedProduct.sku} · Stock actual: {selectedProduct.stock} {selectedProduct.unit}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer shrink-0"
                  onClick={() => { setSelectedProduct(null); setValue("productId", ""); }}
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                <Input
                  placeholder="Buscar producto..."
                  value={productSearch}
                  className="pl-8"
                  onChange={(e) => setProductSearch(e.target.value)}
                  onFocus={() => setShowProductList(true)}
                />

                {showProductList && productsData && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-lg">
                    {productsData.data.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-[hsl(var(--muted-foreground))]">
                        Sin resultados
                      </p>
                    ) : (
                      productsData.data.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-[hsl(var(--muted))] cursor-pointer transition-colors"
                          onClick={() => selectProduct(p)}
                        >
                          <div>
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{p.sku}</p>
                          </div>
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            Stock: {p.stock}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            {errors.productId && (
              <p className="text-xs text-[hsl(var(--destructive))]">Seleccioná un producto</p>
            )}
          </div>

          {/* Reason + Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Motivo *</Label>
              <Select
                value={watch("reason")}
                onValueChange={(v) => setValue("reason", v as MovementInput["reason"], { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qty">Cantidad *</Label>
              <Input
                id="qty"
                type="number"
                min="1"
                step="1"
                {...register("quantity", { valueAsNumber: true })}
              />
              {errors.quantity && (
                <p className="text-xs text-[hsl(var(--destructive))]">{errors.quantity.message}</p>
              )}
            </div>
          </div>

          {/* Stock preview */}
          {selectedProduct && stockAfter !== null && (
            <div className={cn(
              "rounded-md p-3 text-sm border",
              alertAfter === "CRITICAL"
                ? "border-red-300 bg-red-50 dark:bg-red-900/20"
                : alertAfter === "WARNING"
                ? "border-amber-300 bg-amber-50 dark:bg-amber-900/20"
                : "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20"
            )}>
              <p className="font-medium mb-1">Vista previa del stock</p>
              <div className="flex items-center gap-3">
                <span className="text-[hsl(var(--muted-foreground))]">
                  Actual: <strong>{selectedProduct.stock}</strong>
                </span>
                <span>→</span>
                <span className={cn(
                  "font-semibold",
                  stockAfter < 0 ? "text-red-600" : ""
                )}>
                  {stockAfter} {selectedProduct.unit}
                </span>
                {stockAfter < 0 && (
                  <Badge variant="destructive" className="text-[10px]">Stock insuficiente</Badge>
                )}
                {alertAfter === "CRITICAL" && stockAfter >= 0 && (
                  <Badge variant="destructive" className="text-[10px]">Quedará sin stock</Badge>
                )}
                {alertAfter === "WARNING" && (
                  <Badge className="text-[10px] bg-amber-500">Bajo mínimo</Badge>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Observaciones adicionales..."
              rows={2}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (stockAfter !== null && stockAfter < 0)}
              className="cursor-pointer"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar movimiento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
