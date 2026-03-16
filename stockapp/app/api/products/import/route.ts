/**
 * POST /api/products/import — bulk CSV import
 * Expected CSV columns: name, sku, category, description, salePrice,
 *   costPrice, stock, minStock, supplier, unit
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { productSchema } from "@/lib/validations";
import type { Role } from "@/types";

interface CsvRow {
  name?: string;
  sku?: string;
  category?: string;
  description?: string;
  salePrice?: string;
  costPrice?: string;
  stock?: string;
  minStock?: string;
  supplier?: string;
  unit?: string;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const role = session.user.role as Role;
  if (role === "EMPLOYEE") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const body: unknown = await req.json();
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Se esperaba un array de productos" }, { status: 400 });
  }

  // Cap import size to prevent abuse
  if (body.length > 500) {
    return NextResponse.json({ error: "Máximo 500 productos por importación" }, { status: 400 });
  }

  const rows = body as CsvRow[];
  const results = { created: 0, skipped: 0, errors: [] as string[] };

  // Load all categories for lookup
  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

  for (const [index, row] of rows.entries()) {
    const lineNum = index + 2; // +2 = header row + 1-indexed

    // Resolve category name → id
    const categoryId = categoryMap.get((row.category ?? "").toLowerCase());
    if (!categoryId) {
      results.errors.push(`Fila ${lineNum}: categoría "${row.category}" no encontrada`);
      results.skipped++;
      continue;
    }

    const productData = {
      name: row.name ?? "",
      sku: (row.sku ?? "").toUpperCase(),
      description: row.description,
      categoryId,
      salePrice: parseFloat(row.salePrice ?? "0"),
      costPrice: parseFloat(row.costPrice ?? "0"),
      stock: parseInt(row.stock ?? "0", 10),
      minStock: parseInt(row.minStock ?? "5", 10),
      supplier: row.supplier,
      unit: row.unit ?? "unit",
    };

    const parsed = productSchema.safeParse(productData);
    if (!parsed.success) {
      const msgs = Object.values(parsed.error.flatten().fieldErrors).flat().join(", ");
      results.errors.push(`Fila ${lineNum} (${row.sku}): ${msgs}`);
      results.skipped++;
      continue;
    }

    // Skip duplicates
    const existing = await prisma.product.findUnique({ where: { sku: parsed.data.sku } });
    if (existing) {
      results.errors.push(`Fila ${lineNum}: SKU "${parsed.data.sku}" ya existe — omitido`);
      results.skipped++;
      continue;
    }

    await prisma.product.create({ data: parsed.data });
    results.created++;
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "IMPORT_PRODUCTS",
      entity: "Product",
      details: JSON.stringify(results),
    },
  });

  return NextResponse.json(results, { status: 200 });
}
