import { requireRole } from "@/lib/auth/session";
import { ReportsClient } from "@/components/reports/reports-client";

export const metadata = { title: "Reportes | StockSystem" };

export default async function ReportsPage() {
  await requireRole("MANAGER");
  return <ReportsClient />;
}
