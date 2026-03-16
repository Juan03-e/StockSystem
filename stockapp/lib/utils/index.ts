/**
 * lib/utils/index.ts — Shared utility functions
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AlertLevel, MovementReason, MovementType, Role } from "@/types";

/** shadcn/ui helper — merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format currency in ARS / USD */
export function formatCurrency(
  value: number,
  currency = "USD",
  locale = "es-AR"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

/** Format a date string to locale display */
export function formatDate(date: string | Date, locale = "es-AR"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/** Format date + time */
export function formatDateTime(date: string | Date, locale = "es-AR"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/** Compute alert level for a product */
export function getAlertLevel(stock: number, minStock: number): AlertLevel {
  if (stock === 0) return "CRITICAL";
  if (stock <= minStock) return "WARNING";
  return "OK";
}

/** Human-readable labels */
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  EMPLOYEE: "Empleado",
};

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  ENTRY: "Entrada",
  EXIT: "Salida",
};

export const MOVEMENT_REASON_LABELS: Record<MovementReason, string> = {
  PURCHASE: "Compra",
  RETURN: "Devolución",
  SALE: "Venta",
  LOSS: "Pérdida",
  ADJUSTMENT: "Ajuste",
};

export const ALERT_LEVEL_LABELS: Record<AlertLevel, string> = {
  CRITICAL: "Crítico",
  WARNING: "Bajo mínimo",
  OK: "Normal",
};

/** Sanitize a string for safe display (prevent XSS in dangerouslySetInnerHTML — avoid that, but useful for logs) */
export function sanitize(str: string): string {
  return str.replace(/[<>"'&]/g, (c) => {
    const map: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "&": "&amp;",
    };
    return map[c] ?? c;
  });
}

/** Build audit log detail string */
export function buildAuditDetails(
  before: Record<string, unknown> | null,
  after: Record<string, unknown>
): string {
  return JSON.stringify({ before, after });
}
