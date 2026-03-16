"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { voidMovementSchema, type VoidMovementInput } from "@/lib/validations";
import { formatDateTime, MOVEMENT_TYPE_LABELS, MOVEMENT_REASON_LABELS } from "@/lib/utils";
import type { Movement } from "@/types";

interface VoidMovementDialogProps {
  movement: Movement | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function VoidMovementDialog({ movement, onClose, onSuccess }: VoidMovementDialogProps) {
  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<VoidMovementInput>({ resolver: zodResolver(voidMovementSchema) });

  async function onSubmit(data: VoidMovementInput) {
    if (!movement) return;
    const res = await fetch(`/api/movements/${movement.id}/void`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json() as { error: string };
      toast.error(err.error);
      return;
    }

    onSuccess();
    reset();
    onClose();
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <AlertDialog open={!!movement} onOpenChange={(v) => !v && handleClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[hsl(var(--destructive))]" />
            Anular movimiento
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left">
              <p>Esta acción <strong>no se puede deshacer</strong>. Anular el movimiento revertirá el stock automáticamente.</p>

              {movement && (
                <div className="rounded-md bg-[hsl(var(--muted))] px-3 py-2 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">Producto</span>
                    <span className="font-medium">{movement.product?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">Tipo</span>
                    <span>{MOVEMENT_TYPE_LABELS[movement.type]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">Motivo</span>
                    <span>{MOVEMENT_REASON_LABELS[movement.reason]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">Cantidad</span>
                    <span className="font-semibold">
                      {movement.type === "ENTRY" ? "+" : "-"}{movement.quantity} {movement.product?.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">Fecha</span>
                    <span>{formatDateTime(movement.date)}</span>
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 px-1">
          <div className="space-y-1.5">
            <Label htmlFor="voidReason">
              Motivo de anulación * <span className="text-[hsl(var(--muted-foreground))] font-normal">(mín. 10 caracteres)</span>
            </Label>
            <Textarea
              id="voidReason"
              {...register("voidReason")}
              placeholder="Describí por qué se anula este movimiento..."
              rows={3}
              className="resize-none"
              autoFocus
            />
            {errors.voidReason && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.voidReason.message}</p>
            )}
          </div>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="cursor-pointer" onClick={handleClose}>
              Cancelar
            </AlertDialogCancel>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer bg-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.9)]"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar anulación
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
