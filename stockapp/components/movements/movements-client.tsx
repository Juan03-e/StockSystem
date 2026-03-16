"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { Plus, RefreshCw, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/shared/data-table";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { MovementFormDialog } from "./movement-form-dialog";
import { VoidMovementDialog } from "./void-movement-dialog";
import { movementColumns } from "./movement-columns";
import type { Movement, PaginatedResponse, Role, UserSafe } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface MovementsClientProps {
  userRole: Role;
  currentUserId: string;
}

export function MovementsClient({ userRole, currentUserId }: MovementsClientProps) {
  const isAdmin = userRole === "ADMIN";

  // Filters
  const [productSearch, setProductSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [voidMovement, setVoidMovement] = useState<Movement | null>(null);

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sortBy,
    sortOrder,
    ...(typeFilter !== "all" && { type: typeFilter }),
    ...(reasonFilter !== "all" && { reason: reasonFilter }),
    ...(userFilter !== "all" && { userId: userFilter }),
    ...(dateFrom && { from: dateFrom }),
    ...(dateTo && { to: dateTo }),
    ...(productSearch && { productSearch }),
  });

  const { data, isLoading, mutate } = useSWR<PaginatedResponse<Movement>>(
    `/api/movements?${params}`,
    fetcher
  );

  const { data: users } = useSWR<UserSafe[]>(
    isAdmin ? "/api/users" : null,
    fetcher
  );

  const handleSort = useCallback((col: string, order: "asc" | "desc") => {
    setSortBy(col);
    setSortOrder(order);
    setPage(1);
  }, []);

  // Server-side product search — all filtering done in the API
  const filtered = data?.data ?? [];

  const columns = movementColumns({
    isAdmin,
    onVoid: setVoidMovement,
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Product search */}
          <div className="relative min-w-48 flex-1 max-w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <Input
              placeholder="Buscar producto o SKU..."
              value={productSearch}
              onChange={(e) => { setProductSearch(e.target.value); setPage(1); }}
              className="pl-8 h-9"
            />
          </div>

          {/* Type filter */}
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="h-9 w-36">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-[hsl(var(--muted-foreground))]" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="ENTRY">Entradas</SelectItem>
              <SelectItem value="EXIT">Salidas</SelectItem>
            </SelectContent>
          </Select>

          {/* Reason filter */}
          <Select value={reasonFilter} onValueChange={(v) => { setReasonFilter(v); setPage(1); }}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue placeholder="Motivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los motivos</SelectItem>
              <SelectItem value="PURCHASE">Compra</SelectItem>
              <SelectItem value="RETURN">Devolución</SelectItem>
              <SelectItem value="SALE">Venta</SelectItem>
              <SelectItem value="LOSS">Pérdida</SelectItem>
              <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
            </SelectContent>
          </Select>

          {/* User filter — Admin only */}
          {isAdmin && users && (
            <Select value={userFilter} onValueChange={(v) => { setUserFilter(v); setPage(1); }}>
              <SelectTrigger className="h-9 w-44">
                <SelectValue placeholder="Usuario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los usuarios</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 cursor-pointer"
            onClick={() => mutate()}
            aria-label="Refrescar"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            className="h-9 gap-1.5 cursor-pointer ml-auto"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nuevo movimiento
          </Button>
        </div>

        {/* Date range */}
        <DateRangePicker
          from={dateFrom}
          to={dateTo}
          onFromChange={(v) => { setDateFrom(v); setPage(1); }}
          onToChange={(v) => { setDateTo(v); setPage(1); }}
        />
      </div>

      {/* Stats */}
      {data && (
        <div className="flex items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
          <span>{data.total} movimiento(s)</span>
          <span>
            Entradas:{" "}
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {(data.data ?? []).filter((m) => m.type === "ENTRY" && !m.isVoided).length}
            </span>
          </span>
          <span>
            Salidas:{" "}
            <span className="text-red-500 font-medium">
              {(data.data ?? []).filter((m) => m.type === "EXIT" && !m.isVoided).length}
            </span>
          </span>
          {(data.data ?? []).some((m) => m.isVoided) && (
            <span className="text-[hsl(var(--muted-foreground))]">
              Anulados: {(data.data ?? []).filter((m) => m.isVoided).length}
            </span>
          )}
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        emptyMessage="No se encontraron movimientos con los filtros aplicados."
        onSortChange={handleSort}
        externalSort={{ sortBy, sortOrder }}
      />

      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={data?.total ?? 0}
        totalPages={data?.totalPages ?? 0}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />

      {/* Dialogs */}
      <MovementFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          mutate();
          toast.success("Movimiento registrado y stock actualizado");
        }}
      />

      <VoidMovementDialog
        movement={voidMovement}
        onClose={() => setVoidMovement(null)}
        onSuccess={() => {
          mutate();
          toast.success("Movimiento anulado y stock revertido");
        }}
      />
    </div>
  );
}
