import { cn } from "@/lib/utils";

const COLOR_MAP = {
  blue:   { bg: "bg-blue-50 dark:bg-blue-900/20",     text: "text-blue-700 dark:text-blue-300"     },
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-700 dark:text-indigo-300" },
  green:  { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-300" },
  red:    { bg: "bg-red-50 dark:bg-red-900/20",       text: "text-red-700 dark:text-red-300"       },
  amber:  { bg: "bg-amber-50 dark:bg-amber-900/20",   text: "text-amber-700 dark:text-amber-300"   },
} as const;

interface Card {
  label: string;
  value: number | string;
  color: keyof typeof COLOR_MAP;
}

export function ReportSummaryCards({ cards }: { cards: Card[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => {
        const { bg, text } = COLOR_MAP[c.color];
        return (
          <div key={c.label} className={cn("rounded-lg border p-3 space-y-1", bg)}>
            <p className="text-xs font-medium uppercase tracking-wide opacity-70">{c.label}</p>
            <p className={cn("text-2xl font-bold tabular-nums leading-none", text)}>
              {c.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
