import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { ProductsClient } from "@/components/products/products-client";
import type { Role } from "@/types";

export const metadata: Metadata = { title: "Productos" };

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);
  const role = session!.user.role as Role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Gestión de catálogo e inventario
        </p>
      </div>
      <ProductsClient userRole={role} />
    </div>
  );
}
