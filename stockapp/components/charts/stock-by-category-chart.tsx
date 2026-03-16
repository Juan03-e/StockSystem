"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = [
  "hsl(238,84%,61%)",  // indigo
  "hsl(142,71%,45%)",  // emerald
  "hsl(38,92%,50%)",   // amber
  "hsl(221,83%,53%)",  // blue
  "hsl(330,81%,60%)",  // pink
  "hsl(172,66%,50%)",  // teal
];

interface StockByCategoryChartProps {
  data: { name: string; totalStock: number; totalValue: number }[];
  isLoading: boolean;
}

export function StockByCategoryChart({ data, isLoading }: StockByCategoryChartProps) {
  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data.length) return <Empty />;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={-25}
          textAnchor="end"
          height={48}
        />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(214,32%,91%)",
            fontSize: "12px",
          }}
          formatter={(value) => [value, "Unidades"]}
        />
        <Bar dataKey="totalStock" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function Empty() {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
      Sin datos disponibles
    </div>
  );
}
