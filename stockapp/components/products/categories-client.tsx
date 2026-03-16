"use client";

import { useState } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { categorySchema, type CategoryInput } from "@/lib/validations";
import type { Category } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function CategoriesClient() {
  const { data: categories, isLoading, mutate } = useSWR<Category[]>("/api/categories", fetcher);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    register, handleSubmit, reset, formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({ resolver: zodResolver(categorySchema) });

  function openEdit(cat: Category) {
    setEditCategory(cat);
    reset({ name: cat.name, description: cat.description ?? "" });
    setFormOpen(true);
  }

  function openCreate() {
    setEditCategory(null);
    reset({ name: "", description: "" });
    setFormOpen(true);
  }

  async function onSubmit(data: CategoryInput) {
    const url = editCategory ? `/api/categories/${editCategory.id}` : "/api/categories";
    const method = editCategory ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json() as { error: string };
      toast.error(err.error);
      return;
    }

    toast.success(editCategory ? "Categoría actualizada" : "Categoría creada");
    mutate();
    setFormOpen(false);
  }

  async function handleDelete() {
    if (!deleteCategory) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/categories/${deleteCategory.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        toast.error(err.error);
        return;
      }
      toast.success("Categoría eliminada");
      mutate();
      setDeleteCategory(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5 cursor-pointer" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nueva categoría
        </Button>
      </div>

      {/* Grid of category cards */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories?.map((cat) => (
            <div
              key={cat.id}
              className="kpi-card flex items-start justify-between gap-3 group"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--primary)/0.1)]">
                  <Tag className="h-4 w-4 text-[hsl(var(--primary))]" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{cat.name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    {cat._count?.products ?? 0} producto(s)
                  </p>
                  {cat.description && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 line-clamp-1">
                      {cat.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 cursor-pointer"
                  onClick={() => openEdit(cat)}
                  aria-label="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 cursor-pointer text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]"
                  onClick={() => setDeleteCategory(cat)}
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}

          {categories?.length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed border-[hsl(var(--border))] p-10 text-center text-[hsl(var(--muted-foreground))] text-sm">
              No hay categorías. Creá la primera.
            </div>
          )}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={(v) => !v && setFormOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editCategory ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Nombre *</Label>
              <Input id="cat-name" {...register("name")} placeholder="Ej: Electrónica" />
              {errors.name && <p className="text-xs text-[hsl(var(--destructive))]">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">Descripción</Label>
              <Textarea id="cat-desc" {...register("description")} rows={2} className="resize-none" />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="cursor-pointer">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editCategory ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteCategory} onOpenChange={(v) => !v && setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto eliminará la categoría <strong>{deleteCategory?.name}</strong>.
              Solo se puede eliminar si no tiene productos asignados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="cursor-pointer bg-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.9)]"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
