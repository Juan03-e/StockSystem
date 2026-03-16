/**
 * GET  /api/users — list users (Admin/Manager for filter dropdowns)
 * POST /api/users — create user (Admin only)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { createUserSchema } from "@/lib/validations";
import { buildAuditDetails } from "@/lib/utils";
import bcrypt from "bcryptjs";
import type { Role } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // All authenticated users can fetch the user list (for filter dropdowns)
  // Password hash is never returned
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, email: true, role: true,
      isActive: true, lastLogin: true, createdAt: true, updatedAt: true,
    },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const role = session.user.role as Role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el Administrador puede crear usuarios" }, { status: 403 });
  }

  const body: unknown = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: { ...parsed.data, password: hashedPassword },
    select: {
      id: true, name: true, email: true, role: true,
      isActive: true, lastLogin: true, createdAt: true, updatedAt: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE_USER",
      entity: "User",
      entityId: user.id,
      details: buildAuditDetails(null, { name: user.name, role: user.role }),
    },
  });

  return NextResponse.json(user, { status: 201 });
}
