import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";

export interface StockReportRow {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  costPrice: number | null;
  salePrice: number | null;
  totalValue: number;
  alertLevel: "OK" | "WARNING" | "CRITICAL";
  supplier: string | null;
}

export interface StockReportResponse {
  rows: StockReportRow[];
  summary: {
    totalProducts: number;
    totalValue: number;
    criticalCount: number;
    warningCount: number;
    okCount: number;
  };
  generatedAt: string;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId") || undefined;
  const alertFilter = searchParams.get("alert") || undefined; // "OK" | "WARNING" | "CRITICAL"
  const search = searchParams.get("search") || undefined;

  const products = await prisma.product.findMany({
    where: {
      isArchived: false,
      ...(categoryId ? { categoryId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { sku: { contains: search } },
            ],
          }
        : {}),
    },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  const rows: StockReportRow[] = products.map((p) => {
    let alertLevel: "OK" | "WARNING" | "CRITICAL" = "OK";
    if (p.stock === 0) alertLevel = "CRITICAL";
    else if (p.stock <= p.minStock) alertLevel = "WARNING";

    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category.name,
      stock: p.stock,
      minStock: p.minStock,
      unit: p.unit,
      costPrice: p.costPrice,
      salePrice: p.salePrice,
      totalValue: p.costPrice ? p.costPrice * p.stock : 0,
      alertLevel,
      supplier: p.supplier,
    };
  });

  const filtered = alertFilter ? rows.filter((r) => r.alertLevel === alertFilter) : rows;

  const totalValue = filtered.reduce((s, r) => s + r.totalValue, 0);

  return NextResponse.json({
    rows: filtered,
    summary: {
      totalProducts: filtered.length,
      totalValue,
      criticalCount: rows.filter((r) => r.alertLevel === "CRITICAL").length,
      warningCount: rows.filter((r) => r.alertLevel === "WARNING").length,
      okCount: rows.filter((r) => r.alertLevel === "OK").length,
    },
    generatedAt: new Date().toISOString(),
  } satisfies StockReportResponse);
}
