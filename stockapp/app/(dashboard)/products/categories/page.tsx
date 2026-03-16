import type { Metadata } from "next";
import { CategoriesClient } from "@/components/products/categories-client";

export const metadata: Metadata = { title: "Categorías" };

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categorías</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Gestión de categorías de productos
        </p>
      </div>
      <CategoriesClient />
    </div>
  );
}
