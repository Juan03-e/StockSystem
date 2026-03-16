"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package2,
  Box,
  ArrowLeftRight,
  BellRing,
  FileText,
  Users,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type Role } from "@/types";
import { useState } from "react";
import { AlertBadge } from "./alert-badge";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  roles: Role[];
  badge?: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
  },
  {
    href: "/products",
    icon: Box,
    label: "Productos",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/products/categories",
    icon: Tag,
    label: "Categorías",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/movements",
    icon: ArrowLeftRight,
    label: "Movimientos",
    roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
  },
  {
    href: "/alerts",
    icon: BellRing,
    label: "Alertas",
    roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
  },
  {
    href: "/reports",
    icon: FileText,
    label: "Reportes",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/users",
    icon: Users,
    label: "Usuarios",
    roles: ["ADMIN"],
  },
];

interface SidebarProps {
  userRole: Role;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full border-r border-white/5 transition-all duration-200",
        "bg-[hsl(var(--sidebar-bg))]",
        collapsed ? "w-16" : "w-60"
      )}
      aria-label="Navegación principal"
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-white/5",
          collapsed && "justify-center"
        )}
      >
        <Package2 className="h-6 w-6 text-[hsl(var(--primary))] shrink-0" />
        {!collapsed && (
          <span className="font-lexend text-base font-semibold text-white truncate">
            StockSystem
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          // Exact match, or prefix match only when no other nav item exactly matches the pathname
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(item.href + "/") &&
              !visibleItems.some(
                (other) => other.href !== item.href && pathname === other.href
              ));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "nav-item",
                isActive && "active",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
              {!collapsed && item.href === "/alerts" && (
                <AlertBadge />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className={cn(
          "absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center",
          "rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))]",
          "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
          "transition-colors duration-150 cursor-pointer shadow-sm"
        )}
        aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      {/* User role badge at bottom */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-white/5">
          <p className="text-xs text-[hsl(var(--sidebar-fg))]">
            Acceso:{" "}
            <span className="text-white font-medium">
              {userRole === "ADMIN"
                ? "Administrador"
                : userRole === "MANAGER"
                ? "Gerente"
                : "Empleado"}
            </span>
          </p>
        </div>
      )}
    </aside>
  );
}
