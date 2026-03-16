/**
 * GET  /api/movements — paginated list with filters
 * POST /api/movements — create movement + update product stock atomically
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { movementSchema, paginationSchema } from "@/lib/validations";
import { buildAuditDetails } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = req.nextUrl;

  const pagination = paginationSchema.safeParse({
    page: searchParams.get("page") ?? 1,
    pageSize: searchParams.get("pageSize") ?? 20,
    sortBy: searchParams.get("sortBy") ?? "date",
    sortOrder: searchParams.get("sortOrder") ?? "desc",
  });
  if (!pagination.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const { page, pageSize, sortBy, sortOrder } = pagination.data;

  // Filters
  const productId     = searchParams.get("productId") ?? undefined;
  const userId        = searchParams.get("userId") ?? undefined;
  const type          = searchParams.get("type") ?? undefined;
  const reason        = searchParams.get("reason") ?? undefined;
  const fromDate      = searchParams.get("from") ?? undefined;
  const toDate        = searchParams.get("to") ?? undefined;
  const productSearch = searchParams.get("productSearch") ?? undefined;

  const where = {
    ...(productId && { productId }),
    ...(userId && { userId }),
    ...(type && { type }),
    ...(reason && { reason }),
    ...((fromDate || toDate) && {
      date: {
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate + "T23:59:59.999Z") }),
      },
    }),
    ...(productSearch && {
      product: {
        OR: [
          { name: { contains: productSearch } },
          { sku:  { contains: productSearch } },
        ],
      },
    }),
  };

  const allowedSortCols = ["date", "quantity", "type"] as const;
  type SortCol = typeof allowedSortCols[number];
  const safeSortBy: SortCol = allowedSortCols.includes(sortBy as SortCol)
    ? (sortBy as SortCol)
    : "date";

  const [data, total] = await Promise.all([
    prisma.movement.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true } },
        user:    { select: { id: true, name: true } },
        voidedBy: { select: { id: true, name: true } },
      },
      orderBy: { [safeSortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.movement.count({ where }),
  ]);

  return NextResponse.json({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body: unknown = await req.json();
  const parsed = movementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { productId, type, reason, quantity, notes, date } = parsed.data;

  // Validate product exists and is not archived
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.isArchived) {
    return NextResponse.json({ error: "Producto no encontrado o archivado" }, { status: 404 });
  }

  // Prevent negative stock on exits
  if (type === "EXIT" && product.stock < quantity) {
    return NextResponse.json(
      { error: `Stock insuficiente. Disponible: ${product.stock} ${product.unit}` },
      { status: 409 }
    );
  }

  // Atomic transaction: create movement + update stock
  const [movement] = await prisma.$transaction([
    prisma.movement.create({
      data: {
        productId,
        userId: session.user.id,
        type,
        reason,
        quantity,
        notes,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true } },
        user:    { select: { id: true, name: true } },
      },
    }),
    prisma.product.update({
      where: { id: productId },
      data: {
        stock: {
          [type === "ENTRY" ? "increment" : "decrement"]: quantity,
        },
      },
    }),
  ]);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE_MOVEMENT",
      entity: "Movement",
      entityId: movement.id,
      details: buildAuditDetails(
        { stock: product.stock },
        { type, reason, quantity, newStock: type === "ENTRY" ? product.stock + quantity : product.stock - quantity }
      ),
    },
  });

  return NextResponse.json(movement, { status: 201 });
}
