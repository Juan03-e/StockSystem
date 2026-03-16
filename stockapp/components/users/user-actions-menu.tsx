"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, PowerOff, Power, History } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { UserRow } from "./users-client";

interface Props {
  user: UserRow;
  onEdit: () => void;
  onActivity: () => void;
  onMutate: () => void;
}

export function UserActionsMenu({ user, onEdit, onActivity, onMutate }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function toggleActive() {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: !user.isActive,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Error al actualizar");
        return;
      }
      toast.success(user.isActive ? "Usuario desactivado" : "Usuario activado");
      onMutate();
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-md p-1.5 hover:bg-[hsl(var(--muted))] transition-colors">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Acciones</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onActivity}>
            <History className="mr-2 h-4 w-4" />
            Ver actividad
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setConfirmOpen(true)}
            className={user.isActive ? "text-red-600 focus:text-red-600" : "text-emerald-600 focus:text-emerald-600"}
          >
            {user.isActive
              ? <><PowerOff className="mr-2 h-4 w-4" /> Desactivar</>
              : <><Power className="mr-2 h-4 w-4" /> Activar</>
            }
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.isActive ? "¿Desactivar usuario?" : "¿Activar usuario?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.isActive
                ? `${user.name} no podrá iniciar sesión hasta que sea reactivado.`
                : `${user.name} podrá volver a iniciar sesión con sus credenciales.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={toggleActive}
              disabled={loading}
              className={user.isActive
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-600"
                : "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-600"
              }
            >
              {loading ? "Procesando…" : user.isActive ? "Desactivar" : "Activar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
