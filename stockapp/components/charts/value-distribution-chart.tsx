"use client";

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

const COLORS = [
  "hsl(238,84%,61%)",
  "hsl(142,71%,45%)",
  "hsl(38,92%,50%)",
  "hsl(221,83%,53%)",
  "hsl(330,81%,60%)",
  "hsl(172,66%,50%)",
];

interface ValueDistributionChartProps {
  data: { name: string; value: number }[];
  isLoading: boolean;
}

function CustomLabel(props: PieLabelRenderProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (!cx || !cy || !midAngle || !innerRadius || !outerRadius || !percent) return null;
  if ((percent as number) < 0.05) return null;

  const RADIAN = Math.PI / 180;
  const radius = (innerRadius as number) + ((outerRadius as number) - (innerRadius as number)) * 0.5;
  const x = (cx as number) + radius * Math.cos(-(midAngle as number) * RADIAN);
  const y = (cy as number) + radius * Math.sin(-(midAngle as number) * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${((percent as number) * 100).toFixed(0)}%`}
    </text>
  );
}

export function ValueDistributionChart({ data, isLoading }: ValueDistributionChartProps) {
  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data.length) return <Empty />;

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="45%"
            outerRadius="75%"
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={CustomLabel}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid hsl(214,32%,91%)",
              fontSize: "12px",
            }}
            formatter={(value) => [formatCurrency(Number(value)), "Valor"]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Custom legend with values */}
      <div className="space-y-1">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="truncate text-[hsl(var(--muted-foreground))]">{d.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="font-medium tabular-nums">{formatCurrency(d.value)}</span>
              <span className="text-[hsl(var(--muted-foreground))] tabular-nums w-10 text-right">
                {total > 0 ? `${((d.value / total) * 100).toFixed(0)}%` : "0%"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
      Sin datos de inventario
    </div>
  );
}
