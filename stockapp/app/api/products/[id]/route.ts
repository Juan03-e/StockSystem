/**
 * GET    /api/products/[id]  — single product
 * PUT    /api/products/[id]  — update product (Manager/Admin)
 * DELETE /api/products/[id]  — archive product (Admin only)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { updateProductSchema } from "@/lib/validations";
import { buildAuditDetails } from "@/lib/utils";
import type { Role } from "@/types";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const role = session.user.role as Role;
  if (role === "EMPLOYEE") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  const body: unknown = await req.json();
  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  // If SKU changed, check uniqueness
  if (parsed.data.sku && parsed.data.sku !== existing.sku) {
    const skuConflict = await prisma.product.findUnique({ where: { sku: parsed.data.sku } });
    if (skuConflict) {
      return NextResponse.json({ error: "El SKU ya existe" }, { status: 409 });
    }
  }

  const updated = await prisma.product.update({
    where: { id },
    data: parsed.data,
    include: { category: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE_PRODUCT",
      entity: "Product",
      entityId: id,
      details: buildAuditDetails(
        { name: existing.name, stock: existing.stock },
        { name: updated.name, stock: updated.stock }
      ),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const role = session.user.role as Role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el Administrador puede archivar productos" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  // Soft delete — archive instead of hard delete
  await prisma.product.update({ where: { id }, data: { isArchived: true } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "ARCHIVE_PRODUCT",
      entity: "Product",
      entityId: id,
      details: buildAuditDetails({ sku: existing.sku }, { isArchived: true }),
    },
  });

  return NextResponse.json({ success: true });
}
