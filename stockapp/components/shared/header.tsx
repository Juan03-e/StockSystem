"use client";

import { type Session } from "next-auth";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

interface HeaderProps {
  user: Session["user"];
}

export function Header({ user }: HeaderProps) {
  return (
    <header
      className="flex h-14 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 shrink-0"
      aria-label="Barra de encabezado"
    >
      {/* Left — breadcrumb placeholder (filled by each page via slot/context if needed) */}
      <div className="text-sm text-[hsl(var(--muted-foreground))]" />

      {/* Right — actions */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
