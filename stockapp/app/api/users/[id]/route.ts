/**
 * GET    /api/users/[id]  — get single user (Admin only)
 * PUT    /api/users/[id]  — update user (Admin only)
 * DELETE /api/users/[id]  — deactivate user (Admin only, cannot deactivate self)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { updateUserSchema } from "@/lib/validations";
import { buildAuditDetails } from "@/lib/utils";
import bcrypt from "bcryptjs";
import type { Role } from "@/types";

const USER_SELECT = {
  id: true, name: true, email: true, role: true,
  isActive: true, lastLogin: true, createdAt: true, updatedAt: true,
} as const;

async function requireAdmin(session: Session | null) {
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if ((session.user.role as Role) !== "ADMIN")
    return NextResponse.json({ error: "Solo el Administrador puede gestionar usuarios" }, { status: 403 });
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const guard = await requireAdmin(session);
  if (guard) return guard;

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const guard = await requireAdmin(session);
  if (guard) return guard;

  const { id } = await params;

  const existing = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  if (!existing) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const body: unknown = await req.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { password, ...rest } = parsed.data;

  // Admin cannot deactivate themselves
  if (id === session!.user.id && rest.isActive === false) {
    return NextResponse.json({ error: "No puedes desactivar tu propia cuenta" }, { status: 400 });
  }

  // Admin cannot downgrade themselves
  if (id === session!.user.id && rest.role !== "ADMIN") {
    return NextResponse.json({ error: "No puedes cambiar tu propio rol" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { ...rest };
  if (password && password.trim() !== "") {
    updateData.password = await bcrypt.hash(password, 12);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: USER_SELECT,
  });

  await prisma.auditLog.create({
    data: {
      userId: session!.user.id,
      action: "UPDATE_USER",
      entity: "User",
      entityId: id,
      details: buildAuditDetails(
        { name: existing.name, role: existing.role, isActive: existing.isActive },
        { name: updated.name, role: updated.role, isActive: updated.isActive }
      ),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const guard = await requireAdmin(session);
  if (guard) return guard;

  const { id } = await params;

  if (id === session!.user.id) {
    return NextResponse.json({ error: "No puedes desactivar tu propia cuenta" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  await prisma.user.update({ where: { id }, data: { isActive: false } });

  await prisma.auditLog.create({
    data: {
      userId: session!.user.id,
      action: "DEACTIVATE_USER",
      entity: "User",
      entityId: id,
      details: buildAuditDetails({ isActive: true }, { isActive: false }),
    },
  });

  return NextResponse.json({ success: true });
}
