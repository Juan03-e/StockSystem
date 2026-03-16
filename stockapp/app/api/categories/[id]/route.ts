/**
 * PUT    /api/categories/[id] — update
 * DELETE /api/categories/[id] — delete (only if no products assigned)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { categorySchema } from "@/lib/validations";
import type { Role } from "@/types";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const role = session.user.role as Role;
  if (role === "EMPLOYEE") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const { id } = await params;
  const body: unknown = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 422 });
  }

  const updated = await prisma.category.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const role = session.user.role as Role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Solo Admin puede eliminar categorías" }, { status: 403 });

  const { id } = await params;

  // Prevent deletion if products exist
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: tiene ${productCount} producto(s) asignado(s)` },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
