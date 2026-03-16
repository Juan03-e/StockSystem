import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ count: 0 }, { status: 401 });

  // SQLite doesn't support column comparisons in WHERE — fetch and filter in JS
  const products = await prisma.product.findMany({
    where: { isArchived: false },
    select: { stock: true, minStock: true },
  });

  const count = products.filter((p) => p.stock <= p.minStock).length;

  return NextResponse.json({ count });
}
