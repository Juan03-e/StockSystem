"use client";

import { useState } from "react";
import useSWR from "swr";
import { Users, Plus, Search, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/utils";
import { UserFormDialog } from "./user-form-dialog";
import { UserActionsMenu } from "./user-actions-menu";
import { ActivityLogPanel } from "./activity-log-panel";
import type { Role } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos los roles" },
  { value: "ADMIN", label: "Administrador" },
  { value: "MANAGER", label: "Gerente" },
  { value: "EMPLOYEE", label: "Empleado" },
];

const ROLE_BADGE: Record<Role, string> = {
  ADMIN:    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  MANAGER:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  EMPLOYEE: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
};

export function UsersClient() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [activityUser, setActivityUser] = useState<UserRow | null>(null);

  const { data: users, isLoading, mutate } = useSWR<UserRow[]>("/api/users", fetcher);

  const filtered = (users ?? []).filter((u) => {
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const activeCount = (users ?? []).filter((u) => u.isActive).length;
  const adminCount  = (users ?? []).filter((u) => u.role === "ADMIN").length;

  function openCreate() {
    setEditUser(null);
    setFormOpen(true);
  }

  function openEdit(user: UserRow) {
    setEditUser(user);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[hsl(var(--primary))]" />
          <div>
            <h1 className="text-xl font-semibold">Usuarios</h1>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Gestión de acceso y roles
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total usuarios",  value: users?.length ?? "—",  bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-700 dark:text-indigo-300" },
          { label: "Activos",         value: activeCount,            bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-300" },
          { label: "Administradores", value: adminCount,             bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-300" },
        ].map((s) => (
          <div key={s.label} className={`rounded-lg border p-3 space-y-1 ${s.bg}`}>
            <p className="text-xs font-medium uppercase tracking-wide opacity-70">{s.label}</p>
            <p className={`text-2xl font-bold tabular-nums leading-none ${s.text}`}>
              {isLoading ? <Skeleton className="h-7 w-12 inline-block" /> : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Buscar por nombre o email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-transparent pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] cursor-pointer"
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          onClick={() => mutate()}
          className="rounded-md border p-1.5 hover:bg-[hsl(var(--muted))] transition-colors"
          title="Actualizar"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-[hsl(var(--muted)/0.5)]">
              <th className="px-4 py-3 text-left font-medium">Usuario</th>
              <th className="px-4 py-3 text-left font-medium">Rol</th>
              <th className="px-4 py-3 text-left font-medium">Estado</th>
              <th className="px-4 py-3 text-left font-medium">Último acceso</th>
              <th className="px-4 py-3 text-left font-medium">Creado</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : !filtered.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[hsl(var(--muted-foreground))]">
                  Sin usuarios que coincidan
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="border-b hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[hsl(var(--primary)/0.15)] flex items-center justify-center text-xs font-bold text-[hsl(var(--primary))] shrink-0">
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.isActive
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {user.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]">
                    {user.lastLogin ? formatDateTime(user.lastLogin) : "Nunca"}
                  </td>
                  <td className="px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]">
                    {formatDateTime(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <UserActionsMenu
                      user={user}
                      onEdit={() => openEdit(user)}
                      onActivity={() => setActivityUser(user)}
                      onMutate={mutate}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dialogs */}
      <UserFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        user={editUser}
        onSuccess={mutate}
      />

      {activityUser && (
        <ActivityLogPanel
          user={activityUser}
          onClose={() => setActivityUser(null)}
        />
      )}
    </div>
  );
}
