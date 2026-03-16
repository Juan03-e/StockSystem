/**
 * lib/validations/index.ts — Zod schemas for server-side validation (OWASP A03)
 * All API routes must validate input against these schemas before processing.
 */
import { z } from "zod";

// ─────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─────────────────────────────────────────
// USERS
// ─────────────────────────────────────────

export const createUserSchema = z.object({
  name: z.string().min(2, "Nombre muy corto").max(80),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = createUserSchema
  .omit({ password: true })
  .extend({
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[0-9]/)
      .optional()
      .or(z.literal("")),
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ─────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────

export const categorySchema = z.object({
  name: z.string().min(2, "Nombre muy corto").max(60),
  description: z.string().max(200).optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;

// ─────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────

export const productSchema = z.object({
  name: z.string().min(2, "Nombre muy corto").max(120),
  sku: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[A-Z0-9\-_]+$/, "SKU: solo letras mayúsculas, números y guiones"),
  description: z.string().max(500).optional(),
  categoryId: z.string().cuid("Categoría inválida"),
  salePrice: z.number().positive("Precio de venta debe ser positivo"),
  costPrice: z.number().positive("Precio de costo debe ser positivo"),
  stock: z.number().int().min(0, "Stock no puede ser negativo"),
  minStock: z.number().int().min(0),
  supplier: z.string().max(120).optional(),
  unit: z.enum(["unit", "kg", "g", "L", "mL", "box", "pack", "set", "pair"]),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export const updateProductSchema = productSchema.partial().extend({
  isArchived: z.boolean().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ─────────────────────────────────────────
// MOVEMENTS
// ─────────────────────────────────────────

export const movementSchema = z.object({
  productId: z.string().cuid("Producto inválido"),
  type: z.enum(["ENTRY", "EXIT"]),
  reason: z.enum(["PURCHASE", "RETURN", "SALE", "LOSS", "ADJUSTMENT"]),
  quantity: z.number().int().positive("Cantidad debe ser mayor a 0"),
  notes: z.string().max(300).optional(),
  date: z.string().datetime().optional(),
});

export const voidMovementSchema = z.object({
  voidReason: z
    .string()
    .min(10, "Debe detallar el motivo de anulación (mínimo 10 caracteres)")
    .max(300),
});

export type MovementInput = z.infer<typeof movementSchema>;
export type VoidMovementInput = z.infer<typeof voidMovementSchema>;

// ─────────────────────────────────────────
// QUERY PARAMS (pagination + filters)
// ─────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  sortBy: z.string().max(40).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
