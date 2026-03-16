import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";

export interface LowStockRow {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  deficit: number;
  costPrice: number | null;
  reorderCost: number | null;
  supplier: string | null;
  alertLevel: "WARNING" | "CRITICAL";
}

export interface LowStockReportResponse {
  rows: LowStockRow[];
  summary: {
    totalAlerts: number;
    criticalCount: number;
    warningCount: number;
    totalReorderCost: number;
  };
  generatedAt: string;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId") || undefined;

  const products = await prisma.product.findMany({
    where: {
      isArchived: false,
      ...(categoryId ? { categoryId } : {}),
    },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  // Filter in JS due to SQLite column comparison limitation
  const alertProducts = products.filter((p) => p.stock <= p.minStock);

  const rows: LowStockRow[] = alertProducts.map((p) => {
    const alertLevel: "WARNING" | "CRITICAL" = p.stock === 0 ? "CRITICAL" : "WARNING";
    const deficit = Math.max(0, p.minStock - p.stock);
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category.name,
      stock: p.stock,
      minStock: p.minStock,
      unit: p.unit,
      deficit,
      costPrice: p.costPrice,
      reorderCost: p.costPrice ? p.costPrice * deficit : null,
      supplier: p.supplier,
      alertLevel,
    };
  });

  // Sort: CRITICAL first, then by deficit descending
  rows.sort((a, b) => {
    if (a.alertLevel !== b.alertLevel)
      return a.alertLevel === "CRITICAL" ? -1 : 1;
    return b.deficit - a.deficit;
  });

  const totalReorderCost = rows.reduce((s, r) => s + (r.reorderCost ?? 0), 0);

  return NextResponse.json({
    rows,
    summary: {
      totalAlerts: rows.length,
      criticalCount: rows.filter((r) => r.alertLevel === "CRITICAL").length,
      warningCount: rows.filter((r) => r.alertLevel === "WARNING").length,
      totalReorderCost,
    },
    generatedAt: new Date().toISOString(),
  } satisfies LowStockReportResponse);
}
