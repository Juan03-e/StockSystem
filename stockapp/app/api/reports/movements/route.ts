import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";

export interface MovementReportRow {
  id: string;
  date: string;
  productSku: string;
  productName: string;
  category: string;
  type: "ENTRY" | "EXIT";
  reason: string;
  quantity: number;
  unitCost: number | null;
  totalCost: number | null;
  userName: string;
  notes: string | null;
  isVoided: boolean;
}

export interface MovementReportResponse {
  rows: MovementReportRow[];
  summary: {
    totalMovements: number;
    totalEntries: number;
    totalExits: number;
    totalVoided: number;
    totalEntryCost: number;
    totalExitCost: number;
  };
  generatedAt: string;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const type = searchParams.get("type") as "ENTRY" | "EXIT" | null;
  const categoryId = searchParams.get("categoryId") || undefined;
  const userId = searchParams.get("userId") || undefined;
  const includeVoided = searchParams.get("includeVoided") === "true";

  const fromDate = from ? new Date(`${from}T00:00:00`) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(`${to}T23:59:59`) : new Date();

  const movements = await prisma.movement.findMany({
    where: {
      date: { gte: fromDate, lte: toDate },
      ...(type ? { type } : {}),
      ...(userId ? { userId } : {}),
      ...(!includeVoided ? { isVoided: false } : {}),
      ...(categoryId
        ? { product: { categoryId } }
        : {}),
    },
    include: {
      product: { include: { category: true } },
      user: true,
    },
    orderBy: { date: "desc" },
  });

  const rows: MovementReportRow[] = movements.map((m) => ({
    id: m.id,
    date: m.date.toISOString(),
    productSku: m.product.sku,
    productName: m.product.name,
    category: m.product.category.name,
    type: m.type as "ENTRY" | "EXIT",
    reason: m.reason,
    quantity: m.quantity,
    unitCost: m.product.costPrice,
    totalCost: m.product.costPrice ? m.product.costPrice * m.quantity : null,
    userName: m.user.name,
    notes: m.notes,
    isVoided: m.isVoided,
  }));

  const active = rows.filter((r) => !r.isVoided);

  return NextResponse.json({
    rows,
    summary: {
      totalMovements: rows.length,
      totalEntries: active.filter((r) => r.type === "ENTRY").length,
      totalExits: active.filter((r) => r.type === "EXIT").length,
      totalVoided: rows.filter((r) => r.isVoided).length,
      totalEntryCost: active
        .filter((r) => r.type === "ENTRY")
        .reduce((s, r) => s + (r.totalCost ?? 0), 0),
      totalExitCost: active
        .filter((r) => r.type === "EXIT")
        .reduce((s, r) => s + (r.totalCost ?? 0), 0),
    },
    generatedAt: new Date().toISOString(),
  } satisfies MovementReportResponse);
}
