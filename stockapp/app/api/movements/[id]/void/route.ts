/**
 * POST /api/movements/[id]/void — Admin only
 * Voids a movement and reverses the stock change atomically.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { voidMovementSchema } from "@/lib/validations";
import { buildAuditDetails } from "@/lib/utils";
import type { Role } from "@/types";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const role = session.user.role as Role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el Administrador puede anular movimientos" }, { status: 403 });
  }

  const { id } = await params;
  const movement = await prisma.movement.findUnique({
    where: { id },
    include: { product: true },
  });

  if (!movement) return NextResponse.json({ error: "Movimiento no encontrado" }, { status: 404 });
  if (movement.isVoided) return NextResponse.json({ error: "El movimiento ya fue anulado" }, { status: 409 });

  const body: unknown = await req.json();
  const parsed = voidMovementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { voidReason } = parsed.data;
  const stockBefore = movement.product.stock;

  // Reverse the stock change atomically
  const reverseOp = movement.type === "ENTRY"
    ? { decrement: movement.quantity }  // reverse entry = subtract
    : { increment: movement.quantity }; // reverse exit = add back

  // Check if reversal would make stock negative
  if (movement.type === "ENTRY" && movement.product.stock < movement.quantity) {
    return NextResponse.json(
      { error: `No se puede anular: stock actual (${movement.product.stock}) es menor que la cantidad del movimiento (${movement.quantity})` },
      { status: 409 }
    );
  }

  await prisma.$transaction([
    prisma.movement.update({
      where: { id },
      data: {
        isVoided: true,
        voidReason,
        voidedById: session.user.id,
        voidedAt: new Date(),
      },
    }),
    prisma.product.update({
      where: { id: movement.productId },
      data: { stock: reverseOp },
    }),
  ]);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "VOID_MOVEMENT",
      entity: "Movement",
      entityId: id,
      details: buildAuditDetails(
        { isVoided: false, stock: stockBefore },
        { isVoided: true, voidReason, stockAfterReversal: movement.type === "ENTRY" ? stockBefore - movement.quantity : stockBefore + movement.quantity }
      ),
    },
  });

  return NextResponse.json({ success: true });
}
