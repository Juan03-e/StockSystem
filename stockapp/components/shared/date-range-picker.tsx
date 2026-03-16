"use client";

import { CalendarDays, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface DateRangePickerProps {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}

export function DateRangePicker({ from, to, onFromChange, onToChange }: DateRangePickerProps) {
  const hasFilter = from || to;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))]">
        <CalendarDays className="h-4 w-4" />
        <span>Rango de fechas:</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-[hsl(var(--muted-foreground))] whitespace-nowrap">Desde</Label>
          <Input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => onFromChange(e.target.value)}
            className="h-8 w-36 text-sm"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-[hsl(var(--muted-foreground))] whitespace-nowrap">Hasta</Label>
          <Input
            type="date"
            value={to}
            min={from}
            onChange={(e) => onToChange(e.target.value)}
            className="h-8 w-36 text-sm"
          />
        </div>
      </div>

      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 cursor-pointer text-[hsl(var(--muted-foreground))]"
          onClick={() => { onFromChange(""); onToChange(""); }}
        >
          <X className="h-3.5 w-3.5" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
