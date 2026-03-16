"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { X, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import type { UserRow } from "./users-client";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  CREATE_PRODUCT:   "Creó producto",
  UPDATE_PRODUCT:   "Editó producto",
  DELETE_PRODUCT:   "Archivó producto",
  CREATE_MOVEMENT:  "Registró movimiento",
  VOID_MOVEMENT:    "Anuló movimiento",
  CREATE_USER:      "Creó usuario",
  UPDATE_USER:      "Editó usuario",
  DEACTIVATE_USER:  "Desactivó usuario",
  CREATE_CATEGORY:  "Creó categoría",
  UPDATE_CATEGORY:  "Editó categoría",
  DELETE_CATEGORY:  "Eliminó categoría",
};

const ACTION_COLOR: Record<string, string> = {
  CREATE_PRODUCT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  UPDATE_PRODUCT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DELETE_PRODUCT: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  CREATE_MOVEMENT: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  VOID_MOVEMENT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  CREATE_USER: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  UPDATE_USER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DEACTIVATE_USER: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};
const DEFAULT_COLOR = "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";

interface Props {
  user: UserRow;
  onClose: () => void;
}

export function ActivityLogPanel({ user, onClose }: Props) {
  const { data: logs, isLoading } = useSWR<AuditEntry[]>(
    `/api/users/${user.id}/activity?limit=50`,
    fetcher
  );

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside className="relative z-10 flex w-full max-w-md flex-col bg-[hsl(var(--background))] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[hsl(var(--primary))]" />
            <div>
              <p className="font-semibold text-sm">Actividad</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{user.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Log list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-5 w-24 shrink-0" />
                <Skeleton className="h-5 flex-1" />
              </div>
            ))
          ) : !logs?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-[hsl(var(--muted-foreground))]">
              <Activity className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Sin actividad registrada</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-3 text-sm">
                <time className="shrink-0 text-xs text-[hsl(var(--muted-foreground))] pt-0.5 w-28">
                  {formatDateTime(log.createdAt)}
                </time>
                <div className="flex-1 space-y-1">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_COLOR[log.action] ?? DEFAULT_COLOR}`}>
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>
                  {log.details && <DetailsView raw={log.details} />}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {logs && logs.length > 0 && (
          <div className="border-t px-5 py-3 text-xs text-[hsl(var(--muted-foreground))]">
            Mostrando los últimos {logs.length} registros
          </div>
        )}
      </aside>
    </div>
  );
}

function DetailsView({ raw }: { raw: string }) {
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const before = obj.before as Record<string, unknown> | undefined;
    const after  = obj.after  as Record<string, unknown> | undefined;

    if (!before && !after) return null;

    const keys = Array.from(new Set([
      ...Object.keys(before ?? {}),
      ...Object.keys(after  ?? {}),
    ]));

    const changes = keys.filter(
      (k) => JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k])
    );

    if (!changes.length) return null;

    return (
      <div className="space-y-0.5 mt-1">
        {changes.map((k) => (
          <p key={k} className="text-xs text-[hsl(var(--muted-foreground))]">
            <span className="font-medium text-[hsl(var(--foreground))]">{k}:</span>{" "}
            <span className="line-through opacity-60">{String(before?.[k] ?? "—")}</span>
            {" → "}
            <span>{String(after?.[k] ?? "—")}</span>
          </p>
        ))}
      </div>
    );
  } catch {
    return <p className="text-xs text-[hsl(var(--muted-foreground))]">{raw}</p>;
  }
}
