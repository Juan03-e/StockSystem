"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { Plus, Search, Filter, Upload, RefreshCw, Archive } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/shared/data-table";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { ProductFormDialog } from "./product-form-dialog";
import { DeleteProductDialog } from "./delete-product-dialog";
import { CsvImportDialog } from "./csv-import-dialog";
import { productColumns } from "./product-columns";
import type { Product, Category, PaginatedResponse, Role } from "@/types";
import { formatCurrency, getAlertLevel } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ProductsClientProps {
  userRole: Role;
}

export function ProductsClient({ userRole }: ProductsClientProps) {
  const canEdit = userRole === "ADMIN" || userRole === "MANAGER";
  const canDelete = userRole === "ADMIN";

  // Filters & pagination state
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // Build query string
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sortBy,
    sortOrder,
    archived: String(showArchived),
    ...(search && { search }),
    ...(categoryId !== "all" && { categoryId }),
  });

  const { data, isLoading, mutate } = useSWR<PaginatedResponse<Product>>(
    `/api/products?${params}`,
    fetcher
  );

  const { data: categories } = useSWR<Category[]>("/api/categories", fetcher);

  const handleSort = useCallback((col: string, order: "asc" | "desc") => {
    setSortBy(col);
    setSortOrder(order);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setCategoryId(value);
    setPage(1);
  }, []);

  const columns = productColumns({
    canEdit,
    canDelete,
    onEdit: setEditProduct,
    onDelete: setDeleteProduct,
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: search + filters */}
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <Input
              placeholder="Buscar por nombre, SKU, proveedor..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          <Select value={categoryId} onValueChange={handleCategoryChange}>
            <SelectTrigger className="h-9 w-44">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-[hsl(var(--muted-foreground))]" />
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={showArchived ? "default" : "outline"}
            size="sm"
            className="h-9 cursor-pointer gap-1.5"
            onClick={() => { setShowArchived((v) => !v); setPage(1); }}
          >
            <Archive className="h-3.5 w-3.5" />
            Archivados
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 cursor-pointer"
            onClick={() => mutate()}
            aria-label="Refrescar"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Right: actions */}
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 cursor-pointer gap-1.5"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="h-4 w-4" />
              Importar CSV
            </Button>
            <Button
              size="sm"
              className="h-9 cursor-pointer gap-1.5"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Nuevo producto
            </Button>
          </div>
        )}
      </div>

      {/* Stats row */}
      {data && (
        <div className="flex items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
          <span>{data.total} producto(s)</span>
          {data.data && (
            <>
              <span>
                {data.data.filter((p) => getAlertLevel(p.stock, p.minStock) === "CRITICAL").length} sin stock
              </span>
              <span>
                Valor total:{" "}
                <span className="font-medium text-[hsl(var(--foreground))]">
                  {formatCurrency(
                    data.data.reduce((sum, p) => sum + p.costPrice * p.stock, 0)
                  )}
                </span>
              </span>
            </>
          )}
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        emptyMessage="No se encontraron productos. Creá uno o ajustá los filtros."
        onSortChange={handleSort}
        externalSort={{ sortBy, sortOrder }}
      />

      {/* Pagination */}
      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={data?.total ?? 0}
        totalPages={data?.totalPages ?? 0}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />

      {/* Dialogs */}
      <ProductFormDialog
        open={createOpen || !!editProduct}
        product={editProduct}
        categories={categories ?? []}
        onClose={() => { setCreateOpen(false); setEditProduct(null); }}
        onSuccess={() => { mutate(); toast.success(editProduct ? "Producto actualizado" : "Producto creado"); }}
      />

      <DeleteProductDialog
        product={deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onSuccess={() => { mutate(); toast.success("Producto archivado"); }}
      />

      <CsvImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={(r) => {
          mutate();
          toast.success(`Importación: ${r.created} creados, ${r.skipped} omitidos`);
        }}
      />
    </div>
  );
}
