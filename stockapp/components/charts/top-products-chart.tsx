"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface TopProductsChartProps {
  data: { productId: string; name: string; totalMoved: number }[];
  isLoading: boolean;
}

// Truncate long product names for the axis
function truncate(str: string, n = 28) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

export function TopProductsChart({ data, isLoading }: TopProductsChartProps) {
  if (isLoading) return <Skeleton className="h-72 w-full" />;
  if (!data.length) return <Empty />;

  const chartData = [...data]
    .sort((a, b) => a.totalMoved - b.totalMoved) // ascending so top item is at top in horizontal bar
    .map((d) => ({ ...d, shortName: truncate(d.name) }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(240, chartData.length * 36)}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 32, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="shortName"
          width={180}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(214,32%,91%)",
            fontSize: "12px",
          }}
          formatter={(value) => [value, "Unidades movidas"]}
          labelFormatter={(label) => {
            const item = chartData.find((d) => d.shortName === label);
            return item?.name ?? label;
          }}
        />
        <Bar dataKey="totalMoved" radius={[0, 4, 4, 0]} maxBarSize={24}>
          {chartData.map((_, i) => (
            <Cell
              key={i}
              fill={`hsl(238,84%,${45 + (i / chartData.length) * 25}%)`}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function Empty() {
  return (
    <div className="flex h-72 items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
      Sin movimientos en el período seleccionado
    </div>
  );
}
