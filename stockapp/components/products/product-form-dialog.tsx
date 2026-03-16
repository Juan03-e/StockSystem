"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { productSchema, type ProductInput } from "@/lib/validations";
import type { Product, Category } from "@/types";

const UNITS = ["unit", "kg", "g", "L", "mL", "box", "pack", "set", "pair"] as const;

interface ProductFormDialogProps {
  open: boolean;
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ProductFormDialog({
  open, product, categories, onClose, onSuccess,
}: ProductFormDialogProps) {
  const isEdit = !!product;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      stock: 0, minStock: 5, unit: "unit", salePrice: 0, costPrice: 0,
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku,
        description: product.description ?? "",
        categoryId: product.categoryId,
        salePrice: product.salePrice,
        costPrice: product.costPrice,
        stock: product.stock,
        minStock: product.minStock,
        supplier: product.supplier ?? "",
        unit: product.unit as ProductInput["unit"],
        imageUrl: product.imageUrl ?? "",
      });
    } else {
      reset({ stock: 0, minStock: 5, unit: "unit", salePrice: 0, costPrice: 0 });
    }
  }, [product, reset]);

  async function onSubmit(data: ProductInput) {
    const url = isEdit ? `/api/products/${product!.id}` : "/api/products";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json() as { error: string };
      toast.error(err.error ?? "Error al guardar");
      return;
    }

    onSuccess();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Row 1: Name + SKU */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" {...register("name")} placeholder="Ej: Auriculares Bluetooth" />
              {errors.name && <p className="text-xs text-[hsl(var(--destructive))]">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU *</Label>
              {(() => {
                const { onChange: onSkuChange, ...skuField } = register("sku");
                return (
                  <Input
                    id="sku"
                    {...skuField}
                    onChange={(e) => {
                      e.target.value = e.target.value.toUpperCase();
                      onSkuChange(e);
                    }}
                    placeholder="ELEC-001"
                    className="uppercase"
                    disabled={isEdit}
                  />
                );
              })()}
              {errors.sku && <p className="text-xs text-[hsl(var(--destructive))]">{errors.sku.message}</p>}
            </div>
          </div>

          {/* Row 2: Category + Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Categoría *</Label>
              <Select
                value={watch("categoryId")}
                onValueChange={(v) => setValue("categoryId", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-xs text-[hsl(var(--destructive))]">{errors.categoryId.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Unidad de medida *</Label>
              <Select
                value={watch("unit")}
                onValueChange={(v) => setValue("unit", v as ProductInput["unit"], { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="salePrice">Precio de venta *</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                min="0"
                {...register("salePrice", { valueAsNumber: true })}
              />
              {errors.salePrice && <p className="text-xs text-[hsl(var(--destructive))]">{errors.salePrice.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="costPrice">Precio de costo *</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                min="0"
                {...register("costPrice", { valueAsNumber: true })}
              />
              {errors.costPrice && <p className="text-xs text-[hsl(var(--destructive))]">{errors.costPrice.message}</p>}
            </div>
          </div>

          {/* Row 4: Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="stock">Stock inicial *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                step="1"
                {...register("stock", { valueAsNumber: true })}
              />
              {errors.stock && <p className="text-xs text-[hsl(var(--destructive))]">{errors.stock.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="minStock">Stock mínimo (alerta) *</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                step="1"
                {...register("minStock", { valueAsNumber: true })}
              />
              {errors.minStock && <p className="text-xs text-[hsl(var(--destructive))]">{errors.minStock.message}</p>}
            </div>
          </div>

          {/* Row 5: Supplier + Image URL */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="supplier">Proveedor</Label>
              <Input id="supplier" {...register("supplier")} placeholder="Nombre del proveedor" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="imageUrl">URL de imagen</Label>
              <Input id="imageUrl" {...register("imageUrl")} placeholder="https://..." />
              {errors.imageUrl && <p className="text-xs text-[hsl(var(--destructive))]">{errors.imageUrl.message}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Descripción opcional del producto"
              rows={2}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
