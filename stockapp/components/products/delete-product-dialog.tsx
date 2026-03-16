"use client";

import { useState } from "react";
import { Loader2, Archive } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Product } from "@/types";

interface DeleteProductDialogProps {
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteProductDialog({ product, onClose, onSuccess }: DeleteProductDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleArchive() {
    if (!product) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        toast.error(err.error);
        return;
      }
      onSuccess();
      onClose();
    } catch {
      toast.error("Error al archivar el producto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={!!product} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Archivar producto?</AlertDialogTitle>
          <AlertDialogDescription>
            El producto <strong>{product?.name}</strong> (SKU: {product?.sku}) será archivado
            y no aparecerá en el catálogo activo. Los movimientos históricos se conservan.
            Podés restaurarlo desde la vista de archivados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer" onClick={onClose}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleArchive}
            disabled={loading}
            className="cursor-pointer bg-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.9)]"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Archive className="mr-2 h-4 w-4" />
            )}
            Archivar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
