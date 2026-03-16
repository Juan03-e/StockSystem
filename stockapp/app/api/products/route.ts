/**
 * GET  /api/products  — paginated list with search + category filter
 * POST /api/products  — create new product (Manager/Admin)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { productSchema, paginationSchema } from "@/lib/validations";
import { prisma as db } from "@/lib/db";
import { buildAuditDetails } from "@/lib/utils";
import type { Role } from "@/types";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = req.nextUrl;

  const parsed = paginationSchema.safeParse({
    page: searchParams.get("page") ?? 1,
    pageSize: searchParams.get("pageSize") ?? 20,
    search: searchParams.get("search") ?? undefined,
    sortBy: searchParams.get("sortBy") ?? "name",
    sortOrder: searchParams.get("sortOrder") ?? "asc",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const { page, pageSize, search, sortBy, sortOrder } = parsed.data;
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const archived = searchParams.get("archived") === "true";

  const where = {
    isArchived: archived,
    ...(categoryId && { categoryId }),
    ...(search && {
      OR: [
        { name: { contains: search } },
        { sku: { contains: search } },
        { supplier: { contains: search } },
      ],
    }),
  };

  // Allowed sort columns (prevents SQL injection via dynamic sort)
  const allowedSortCols = ["name", "sku", "stock", "salePrice", "costPrice", "createdAt"] as const;
  type SortCol = typeof allowedSortCols[number];
  const safeSortBy: SortCol = allowedSortCols.includes(sortBy as SortCol)
    ? (sortBy as SortCol)
    : "name";

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: { [safeSortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
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

  const role = session.user.role as Role;
  if (role === "EMPLOYEE") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const body: unknown = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  // Check SKU uniqueness
  const existing = await prisma.product.findUnique({ where: { sku: parsed.data.sku } });
  if (existing) {
    return NextResponse.json({ error: "El SKU ya existe" }, { status: 409 });
  }

  const product = await prisma.product.create({ data: parsed.data });

  // Audit log
  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE_PRODUCT",
      entity: "Product",
      entityId: product.id,
      details: buildAuditDetails(null, { sku: product.sku, name: product.name }),
    },
  });

  return NextResponse.json(product, { status: 201 });
}
