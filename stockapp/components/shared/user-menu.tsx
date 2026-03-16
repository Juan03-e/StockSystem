"use client";

import { signOut } from "next-auth/react";
import { type Session } from "next-auth";
import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ROLE_LABELS } from "@/lib/utils";
import type { Role } from "@/types";

interface UserMenuProps {
  user: Session["user"];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu({ user }: UserMenuProps) {
  const role = user.role as Role;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-[hsl(var(--accent))] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
          aria-label="Menú de usuario"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-[hsl(var(--primary))] text-white">
              {getInitials(user.name ?? "U")}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col items-start leading-none">
            <span className="text-sm font-medium truncate max-w-28">
              {user.name}
            </span>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {ROLE_LABELS[role]}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
              {user.email}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {ROLE_LABELS[role]}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-[hsl(var(--destructive))] focus:text-[hsl(var(--destructive))]"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
