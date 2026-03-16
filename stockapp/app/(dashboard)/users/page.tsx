import { requireRole } from "@/lib/auth/session";
import { UsersClient } from "@/components/users/users-client";

export const metadata = { title: "Usuarios | StockSystem" };

export default async function UsersPage() {
  await requireRole("ADMIN");
  return <UsersClient />;
}
