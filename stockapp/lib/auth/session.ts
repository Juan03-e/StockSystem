/**
 * lib/auth/session.ts — Server-side session helpers
 */
import { getServerSession } from "next-auth";
import { authOptions } from "./config";
import type { Role } from "@/types";

/** Get session on server — throws if not authenticated */
export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

/** Require a specific role (or higher) — throws if insufficient */
export async function requireRole(minimumRole: Role) {
  const session = await requireSession();
  const hierarchy: Role[] = ["EMPLOYEE", "MANAGER", "ADMIN"];
  const userLevel = hierarchy.indexOf(session.user.role as Role);
  const requiredLevel = hierarchy.indexOf(minimumRole);

  if (userLevel < requiredLevel) {
    throw new Error("FORBIDDEN");
  }

  return session;
}

/** Returns true if the user has at least the given role */
export function hasRole(userRole: Role, minimumRole: Role): boolean {
  const hierarchy: Role[] = ["EMPLOYEE", "MANAGER", "ADMIN"];
  return hierarchy.indexOf(userRole) >= hierarchy.indexOf(minimumRole);
}
