interface Props {
  level: "OK" | "WARNING" | "CRITICAL";
}

const CONFIG = {
  OK:       { label: "Normal",   className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  WARNING:  { label: "Bajo",     className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  CRITICAL: { label: "Sin stock", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export function AlertBadgeInline({ level }: Props) {
  const { label, className } = CONFIG[level];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
