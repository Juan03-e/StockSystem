import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { MovementsClient } from "@/components/movements/movements-client";
import type { Role } from "@/types";

export const metadata: Metadata = { title: "Movimientos" };

export default async function MovementsPage() {
  const session = await getServerSession(authOptions);
  const role = session!.user.role as Role;
  const userId = session!.user.id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Movimientos de stock</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Historial de entradas y salidas del inventario
        </p>
      </div>
      <MovementsClient userRole={role} currentUserId={userId} />
    </div>
  );
}
