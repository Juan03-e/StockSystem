import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { Package2 } from "lucide-react";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between bg-[hsl(var(--sidebar-bg))] p-10 text-white">
        <div className="flex items-center gap-2">
          <Package2 className="h-7 w-7 text-[hsl(var(--primary))]" />
          <span className="font-lexend text-xl font-semibold tracking-tight">
            StockSystem
          </span>
        </div>

        <blockquote className="space-y-2">
          <p className="text-lg leading-relaxed text-slate-300">
            "El control total de tu inventario en tiempo real. Menos pérdidas,
            más eficiencia, mejores decisiones."
          </p>
          <footer className="text-slate-500 text-sm">Sistema de gestión retail</footer>
        </blockquote>

        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Módulos", value: "7" },
            { label: "Roles", value: "3" },
            { label: "Reportes", value: "∞" },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex items-center justify-center p-6 bg-[hsl(var(--background))]">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-2">
            <Package2 className="h-6 w-6 text-[hsl(var(--primary))]" />
            <span className="font-lexend text-xl font-semibold">StockSystem</span>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-2xl font-semibold tracking-tight">
              Bienvenido de nuevo
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Ingresá tus credenciales para acceder al sistema
            </p>
          </div>

          <LoginForm />

          <p className="text-center text-xs text-[hsl(var(--muted-foreground))]">
            StockSystem — Sistema de gestión de inventario
          </p>
        </div>
      </div>
    </div>
  );
}
