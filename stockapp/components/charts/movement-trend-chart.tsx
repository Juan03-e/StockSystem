"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface MovementTrendChartProps {
  data: { date: string; entries: number; exits: number }[];
  isLoading: boolean;
}

export function MovementTrendChart({ data, isLoading }: MovementTrendChartProps) {
  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data.length) return <Empty />;

  // Thin out x-axis labels if too many days
  const tickInterval = data.length > 14 ? Math.ceil(data.length / 10) - 1 : 0;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval={tickInterval}
        />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(214,32%,91%)",
            fontSize: "12px",
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
          formatter={(value) => (value === "entries" ? "Entradas" : "Salidas")}
        />
        <Line
          type="monotone"
          dataKey="entries"
          stroke="hsl(142,71%,45%)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="exits"
          stroke="hsl(0,84%,60%)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function Empty() {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
      Sin movimientos en el período seleccionado
    </div>
  );
}
