/**
 * types/index.ts — Shared TypeScript types for StockSystem
 * These mirror the Prisma schema but are safe to import on the client
 */

// ─────────────────────────────────────────
// ENUMS (string literals — SQLite compatible)
// ─────────────────────────────────────────

export type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";

export type MovementType = "ENTRY" | "EXIT";

export type MovementReason =
  | "PURCHASE"
  | "RETURN"
  | "SALE"
  | "LOSS"
  | "ADJUSTMENT";

export type AlertLevel = "CRITICAL" | "WARNING" | "OK";

export type Unit =
  | "unit"
  | "kg"
  | "g"
  | "L"
  | "mL"
  | "box"
  | "pack"
  | "set"
  | "pair";

// ─────────────────────────────────────────
// DOMAIN TYPES
// ─────────────────────────────────────────

export interface UserSafe {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  categoryId: string;
  category?: Category;
  salePrice: number;
  costPrice: number;
  stock: number;
  minStock: number;
  supplier: string | null;
  unit: string;
  imageUrl: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Movement {
  id: string;
  productId: string;
  product?: Pick<Product, "id" | "name" | "sku" | "unit">;
  userId: string;
  user?: Pick<UserSafe, "id" | "name">;
  type: MovementType;
  reason: MovementReason;
  quantity: number;
  notes: string | null;
  date: string;
  isVoided: boolean;
  voidReason: string | null;
  voidedById: string | null;
  voidedBy?: Pick<UserSafe, "id" | "name"> | null;
  voidedAt: string | null;
}

export interface AuditLog {
  id: string;
  userId: string;
  user?: Pick<UserSafe, "id" | "name">;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
}

// ─────────────────────────────────────────
// DASHBOARD / ANALYTICS TYPES
// ─────────────────────────────────────────

export interface DashboardKPIs {
  totalProducts: number;
  lowStockCount: number;
  criticalStockCount: number;
  totalInventoryValue: number;
  movementsToday: number;
  movementsThisMonth: number;
}

export interface StockByCategory {
  category: string;
  totalStock: number;
  totalValue: number;
}

export interface MovementTrend {
  date: string;
  entries: number;
  exits: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  sku: string;
  totalMoved: number;
}

// ─────────────────────────────────────────
// API RESPONSE WRAPPERS
// ─────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}

// ─────────────────────────────────────────
// FORM TYPES (from Zod schemas)
// ─────────────────────────────────────────

export interface ProductFormData {
  name: string;
  sku: string;
  description?: string;
  categoryId: string;
  salePrice: number;
  costPrice: number;
  stock: number;
  minStock: number;
  supplier?: string;
  unit: string;
  imageUrl?: string;
}

export interface MovementFormData {
  productId: string;
  type: MovementType;
  reason: MovementReason;
  quantity: number;
  notes?: string;
  date?: string;
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: Role;
  isActive: boolean;
}
