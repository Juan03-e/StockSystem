/**
 * GET /api/alerts — returns all non-archived products at or below minStock,
 * sorted by severity (CRITICAL first, then WARNING), then by stock asc.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { getAlertLevel } from "@/lib/utils";
import type { AlertLevel } from "@/types";

export interface AlertProduct {
  id: string;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
  unit: string;
  supplier: string | null;
  imageUrl: string | null;
  alertLevel: AlertLevel;
  category: { id: string; name: string } | null;
  costPrice: number;
  salePrice: number;
}

const LEVEL_ORDER: Record<AlertLevel, number> = {
  CRITICAL: 0,
  WARNING: 1,
  OK: 2,
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { isArchived: false },
    select: {
      id: true, name: true, sku: true, stock: true, minStock: true,
      unit: true, supplier: true, imageUrl: true, costPrice: true, salePrice: true,
      category: { select: { id: true, name: true } },
    },
    orderBy: { stock: "asc" },
  });

  // Filter to only at-risk products and attach alert level
  const alerts: AlertProduct[] = products
    .map((p) => ({ ...p, alertLevel: getAlertLevel(p.stock, p.minStock) }))
    .filter((p) => p.alertLevel !== "OK")
    .sort((a, b) => LEVEL_ORDER[a.alertLevel] - LEVEL_ORDER[b.alertLevel] || a.stock - b.stock);

  const summary = {
    total: alerts.length,
    critical: alerts.filter((a) => a.alertLevel === "CRITICAL").length,
    warning: alerts.filter((a) => a.alertLevel === "WARNING").length,
  };

  return NextResponse.json({ alerts, summary });
}
