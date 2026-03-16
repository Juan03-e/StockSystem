"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { ROLE_LABELS } from "@/lib/utils";
import type { UserRow } from "./users-client";

const createSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(80),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]),
  isActive: z.boolean(),
});

const editSchema = createSchema.extend({
  password: z
    .string()
    .refine(
      (v) => v === "" || (v.length >= 8 && /[A-Z]/.test(v) && /[0-9]/.test(v)),
      "Mínimo 8 caracteres, una mayúscula y un número"
    )
    .optional()
    .or(z.literal("")),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm   = z.infer<typeof editSchema>;

const ROLES = ["ADMIN", "MANAGER", "EMPLOYEE"] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  user: UserRow | null;
  onSuccess: () => void;
}

export function UserFormDialog({ open, onClose, user, onSuccess }: Props) {
  const isEdit = !!user;
  const [showPwd, setShowPwd] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm | EditForm>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: { name: "", email: "", password: "", role: "EMPLOYEE", isActive: true },
  });

  useEffect(() => {
    if (open) {
      if (user) {
        reset({ name: user.name, email: user.email, password: "", role: user.role, isActive: user.isActive });
      } else {
        reset({ name: "", email: "", password: "", role: "EMPLOYEE", isActive: true });
      }
    }
  }, [open, user, reset]);

  async function onSubmit(values: CreateForm | EditForm) {
    const url  = isEdit ? `/api/users/${user!.id}` : "/api/users";
    const method = isEdit ? "PUT" : "POST";

    const body = { ...values };
    // Don't send empty password on edit
    if (isEdit && (!body.password || body.password === "")) {
      delete (body as Partial<typeof body>).password;
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Error al guardar");
      return;
    }

    toast.success(isEdit ? "Usuario actualizado" : "Usuario creado");
    onSuccess();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Nombre completo</label>
            <input
              {...register("name")}
              className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              placeholder="Juan Pérez"
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Email{isEdit && <span className="ml-1 text-xs text-[hsl(var(--muted-foreground))] font-normal">(no editable)</span>}
            </label>
            <input
              {...register("email")}
              type="email"
              readOnly={isEdit}
              className={`w-full rounded-md border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] ${
                isEdit
                  ? "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed"
                  : "bg-transparent"
              }`}
              placeholder="usuario@empresa.com"
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Contraseña {isEdit && <span className="text-[hsl(var(--muted-foreground))] font-normal">(dejar vacío para no cambiar)</span>}
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPwd ? "text" : "password"}
                className="w-full rounded-md border bg-transparent px-3 py-1.5 pr-9 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                placeholder={isEdit ? "••••••••" : "Mínimo 8 caracteres"}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {/* Role */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Rol</label>
            <select
              {...register("role")}
              className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] cursor-pointer"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
          </div>

          {/* Active */}
          <div className="flex items-center gap-2">
            <input
              {...register("isActive")}
              id="isActive"
              type="checkbox"
              className="h-4 w-4 rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
              Usuario activo
            </label>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border px-4 py-1.5 text-sm font-medium hover:bg-[hsl(var(--muted))] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-[hsl(var(--primary))] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSubmitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear usuario"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
