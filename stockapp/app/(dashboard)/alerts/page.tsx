import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { AlertsClient } from "@/components/alerts/alerts-client";
import type { Role } from "@/types";

export const metadata: Metadata = { title: "Alertas de stock" };

export default async function AlertsPage() {
  const session = await getServerSession(authOptions);
  const role = session!.user.role as Role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Alertas de stock</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Productos con stock crítico o por debajo del mínimo configurado
        </p>
      </div>
      <AlertsClient userRole={role} />
    </div>
  );
}
