"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

interface CsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (result: ImportResult) => void;
}

export function CsvImportDialog({ open, onClose, onSuccess }: CsvImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    setFile(f);
    setResult(null);
    Papa.parse<Record<string, string>>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setPreview(res.data.slice(0, 5));
      },
    });
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (res) => {
        try {
          const response = await fetch("/api/products/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(res.data),
          });
          const data = await response.json() as ImportResult;
          setResult(data);
          if (data.created > 0) onSuccess(data);
        } catch {
          toast.error("Error al importar");
        } finally {
          setLoading(false);
        }
      },
    });
  }

  function handleClose() {
    setFile(null);
    setPreview([]);
    setResult(null);
    onClose();
  }

  const CSV_HEADERS = "name,sku,category,description,salePrice,costPrice,stock,minStock,supplier,unit";

  function downloadTemplate() {
    const example = [
      CSV_HEADERS,
      "Auriculares Bluetooth,ELEC-001,Electrónica,Auriculares inalámbricos,29990,18000,50,10,TechSupplier,unit",
    ].join("\r\n");
    const blob = new Blob(["\uFEFF" + example], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_productos.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar productos desde CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Format hint + template download */}
          <div className="rounded-md bg-[hsl(var(--muted))] px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="font-medium text-[hsl(var(--foreground))]">Formato requerido (cabeceras CSV):</p>
              <button
                type="button"
                onClick={downloadTemplate}
                className="shrink-0 text-[hsl(var(--primary))] hover:underline font-medium whitespace-nowrap"
              >
                Descargar plantilla
              </button>
            </div>
            <code className="break-all">{CSV_HEADERS}</code>
          </div>

          {/* Drop zone */}
          {!file && (
            <div
              className={cn(
                "rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors",
                dragOver
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)]"
                  : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)]"
              )}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
            >
              <Upload className="mx-auto h-8 w-8 text-[hsl(var(--muted-foreground))] mb-2" />
              <p className="text-sm font-medium">Arrastrá o hacé clic para subir</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Solo archivos .csv</p>
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          )}

          {/* File selected */}
          {file && !result && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-md border border-[hsl(var(--border))] p-3">
                <FileText className="h-5 w-5 text-[hsl(var(--primary))]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => { setFile(null); setPreview([]); }}>
                  Cambiar
                </Button>
              </div>

              {/* Preview */}
              {preview.length > 0 && (
                <div className="overflow-x-auto rounded-md border border-[hsl(var(--border))]">
                  <table className="text-xs w-full">
                    <thead className="bg-[hsl(var(--muted))]">
                      <tr>
                        {Object.keys(preview[0]).slice(0, 6).map((h) => (
                          <th key={h} className="px-2 py-1.5 text-left font-medium text-[hsl(var(--muted-foreground))]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-t border-[hsl(var(--border))]">
                          {Object.values(row).slice(0, 6).map((val, j) => (
                            <td key={j} className="px-2 py-1.5 truncate max-w-24">{val}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="px-3 py-2 text-xs text-[hsl(var(--muted-foreground))] border-t border-[hsl(var(--border))]">
                    Mostrando primeras {preview.length} filas
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-md bg-[hsl(var(--muted))] p-4">
                <CheckCircle className="h-5 w-5 text-[hsl(var(--success))] shrink-0" />
                <div>
                  <p className="font-medium">{result.created} productos creados</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {result.skipped} omitidos
                  </p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="rounded-md border border-[hsl(var(--destructive)/0.3)] bg-[hsl(var(--destructive)/0.05)] p-3 space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--destructive))]">
                    <AlertCircle className="h-4 w-4" />
                    {result.errors.length} errores
                  </div>
                  <ul className="text-xs text-[hsl(var(--muted-foreground))] space-y-0.5 max-h-32 overflow-y-auto">
                    {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} className="cursor-pointer">
            {result ? "Cerrar" : "Cancelar"}
          </Button>
          {file && !result && (
            <Button onClick={handleImport} disabled={loading} className="cursor-pointer">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Importar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
