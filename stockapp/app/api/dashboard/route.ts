/**
 * GET /api/dashboard — all KPIs and chart data in one query
 * Accepts optional ?from=YYYY-MM-DD&to=YYYY-MM-DD for chart filtering
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { getAlertLevel } from "@/lib/utils";
import { format, subDays, eachDayOfInterval, parseISO, startOfDay, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  // Default: last 30 days
  const toDate = toParam ? endOfDay(parseISO(toParam)) : endOfDay(new Date());
  const fromDate = fromParam ? startOfDay(parseISO(fromParam)) : startOfDay(subDays(toDate, 29));

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  // ── Fetch all data in parallel ───────────────────────────────────────────
  const [products, movements, movementsToday] = await Promise.all([
    prisma.product.findMany({
      where: { isArchived: false },
      select: {
        id: true, stock: true, minStock: true, costPrice: true,
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.movement.findMany({
      where: {
        isVoided: false,
        date: { gte: fromDate, lte: toDate },
      },
      select: { type: true, quantity: true, date: true, productId: true },
    }),
    prisma.movement.count({
      where: {
        isVoided: false,
        date: { gte: todayStart, lte: todayEnd },
      },
    }),
  ]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => getAlertLevel(p.stock, p.minStock) !== "OK").length;
  const criticalCount = products.filter((p) => p.stock === 0).length;
  const totalInventoryValue = products.reduce((sum, p) => sum + p.costPrice * p.stock, 0);
  const movementsThisMonth = movements.length;

  // ── Chart 1: Stock by category ────────────────────────────────────────────
  const categoryMap = new Map<string, { name: string; totalStock: number; totalValue: number }>();
  for (const p of products) {
    const catId = p.category?.id ?? "uncategorized";
    const catName = p.category?.name ?? "Sin categoría";
    const existing = categoryMap.get(catId);
    if (existing) {
      existing.totalStock += p.stock;
      existing.totalValue += p.costPrice * p.stock;
    } else {
      categoryMap.set(catId, {
        name: catName,
        totalStock: p.stock,
        totalValue: p.costPrice * p.stock,
      });
    }
  }
  const stockByCategory = Array.from(categoryMap.values())
    .sort((a, b) => b.totalStock - a.totalStock);

  // ── Chart 2: Movement trend — entries vs exits per day ───────────────────
  const days = eachDayOfInterval({ start: fromDate, end: toDate });
  const trendMap = new Map<string, { date: string; entries: number; exits: number }>(
    days.map((d) => [
      format(d, "yyyy-MM-dd"),
      { date: format(d, "dd/MM"), entries: 0, exits: 0 },
    ])
  );
  for (const m of movements) {
    const key = format(new Date(m.date), "yyyy-MM-dd");
    const slot = trendMap.get(key);
    if (slot) {
      if (m.type === "ENTRY") slot.entries += m.quantity;
      else slot.exits += m.quantity;
    }
  }
  const movementTrend = Array.from(trendMap.values());

  // ── Chart 3: Top 10 most moved products ──────────────────────────────────
  const productMoveMap = new Map<string, number>();
  for (const m of movements) {
    productMoveMap.set(m.productId, (productMoveMap.get(m.productId) ?? 0) + m.quantity);
  }

  // Fetch names for those product IDs
  const topProductIds = [...productMoveMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);

  const topProductDetails = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true, sku: true },
  });

  const productNameMap = new Map(topProductDetails.map((p) => [p.id, `${p.name} (${p.sku})`]));

  const topProducts = topProductIds.map((id) => ({
    productId: id,
    name: productNameMap.get(id) ?? id,
    totalMoved: productMoveMap.get(id) ?? 0,
  }));

  // ── Chart 4: Inventory value distribution by category ────────────────────
  const valueByCategory = stockByCategory
    .filter((c) => c.totalValue > 0)
    .map((c) => ({ name: c.name, value: Math.round(c.totalValue * 100) / 100 }));

  return NextResponse.json({
    kpis: {
      totalProducts,
      lowStockCount,
      criticalCount,
      totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
      movementsToday,
      movementsThisMonth,
    },
    charts: {
      stockByCategory,
      movementTrend,
      topProducts,
      valueByCategory,
    },
    range: {
      from: format(fromDate, "yyyy-MM-dd"),
      to: format(toDate, "yyyy-MM-dd"),
    },
  });
}
