"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function AlertBadge() {
  const { data } = useSWR<{ count: number }>("/api/alerts/count", fetcher, {
    refreshInterval: 60_000, // refresh every minute
  });

  if (!data?.count) return null;

  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[hsl(var(--destructive))] px-1.5 text-[10px] font-bold text-white">
      {data.count > 99 ? "99+" : data.count}
    </span>
  );
}
