# StockSystem

Sistema de gestión de inventario SaaS para retail. Aplicación web full-stack con control de stock, movimientos, alertas, reportes y gestión de usuarios por roles.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Base de datos | SQLite + Prisma ORM v5 |
| Autenticación | NextAuth.js v4 (credentials + JWT) |
| UI | Tailwind CSS v4 + shadcn/ui (Radix UI) |
| Formularios | React Hook Form + Zod |
| Tablas | TanStack Table v8 |
| Gráficos | Recharts v3 |
| Fechas | date-fns v4 |
| Toasts | Sonner v2 |
| Tema | next-themes (light/dark) |

---

## Requisitos previos

- **Node.js** v18 o superior — [descargar](https://nodejs.org/)
- **npm** v9 o superior (viene con Node.js)

Para verificar:

```bash
node --version
npm --version
```

---

## Instalación paso a paso

### 1. Clonar o descomprimir el proyecto

```bash
# Si usás Git:
git clone <url-del-repo> StockSystem
cd StockSystem/stockapp

# O si tenés el ZIP, descomprimirlo y entrar a:
cd StockSystem/stockapp
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copiá el archivo de ejemplo y editalo:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# O creá el archivo .env manualmente con este contenido:
```

Contenido de `.env`:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="cambia-esto-por-una-clave-secreta-aleatoria-de-32-caracteres"
```

> **Importante:** En producción, `NEXTAUTH_SECRET` debe ser una cadena aleatoria segura de al menos 32 caracteres. Podés generarla con:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 4. Crear la base de datos y aplicar el esquema

```bash
npm run db:push
```

### 5. Poblar la base de datos con datos de ejemplo

```bash
npm run db:seed
```

Esto crea:
- 4 usuarios de prueba (ver credenciales abajo)
- 6 categorías de productos
- 23 productos con stock variado
- 32 movimientos de los últimos 35 días

### 6. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Credenciales de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | admin@stocksystem.com | admin123 |
| Gerente | manager@stocksystem.com | manager123 |
| Empleado | carlos@stocksystem.com | employee123 |
| Empleado | ana@stocksystem.com | employee123 |

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo en puerto 3000 |
| `npm run build` | Compila la aplicación para producción |
| `npm run start` | Inicia el servidor de producción (requiere build previo) |
| `npm run db:push` | Aplica el esquema de Prisma a la base de datos |
| `npm run db:seed` | Inserta datos de ejemplo |
| `npm run db:reset` | Resetea la DB y vuelve a sembrar datos |
| `npm run db:studio` | Abre Prisma Studio (GUI para ver la DB) |

---

## Módulos del sistema

### 1. Autenticación (`/login`)
- Login con email y contraseña
- Sesiones JWT de 8 horas
- Redirección automática según rol
- Protección de rutas por rol en middleware

### 2. Productos (`/products`)
- Listado paginado con búsqueda, filtro por categoría y estado
- Crear, editar y archivar productos
- Importación masiva por CSV (hasta 500 filas)
- Gestión de categorías (`/products/categories`)
- Control de stock mínimo por producto

### 3. Movimientos (`/movements`)
- Registro de entradas y salidas de stock
- Motivos: Compra, Devolución, Venta, Pérdida, Ajuste
- Previsualización del stock resultante antes de confirmar
- Anulación de movimientos con reversión automática de stock (solo Admin)
- Filtros por producto, tipo, motivo, usuario y rango de fechas

### 4. Alertas (`/alerts`)
- Lista de productos con stock igual o por debajo del mínimo
- Clasificación en Crítico (sin stock) y Advertencia (stock bajo)
- Barra de progreso visual por producto
- Botón de reposición rápida que abre el formulario de movimiento prellenado
- Actualización automática cada 60 segundos

### 5. Dashboard (`/dashboard`)
- KPIs: total productos, stock bajo, valor del inventario, movimientos del día
- Gráfico de stock por categoría (barras)
- Tendencia de movimientos en el período seleccionado (líneas)
- Top 10 productos más movidos (barras horizontales)
- Distribución de valor por categoría (donut)
- Selector de rango de fechas personalizable

### 6. Reportes (`/reports`) — Gerente y Admin
- **Inventario actual:** tabla completa con valor por producto, filtros por alerta
- **Movimientos:** historial por período con costos, opción de incluir anulados
- **Stock bajo mínimo:** productos en alerta con déficit y costo estimado de reposición
- Exportación a CSV en todos los reportes
- Vista optimizada para impresión

### 7. Usuarios (`/users`) — Solo Admin
- Listado con rol, estado y último acceso
- Crear y editar usuarios con validación de contraseña
- Activar/desactivar cuentas (sin eliminación permanente)
- Panel de actividad por usuario con historial del audit log

---

## Permisos por rol

| Acción | Empleado | Gerente | Admin |
|---|:---:|:---:|:---:|
| Ver productos | ✅ | ✅ | ✅ |
| Crear/editar productos | ❌ | ✅ | ✅ |
| Archivar productos | ❌ | ❌ | ✅ |
| Registrar movimientos | ✅ | ✅ | ✅ |
| Anular movimientos | ❌ | ❌ | ✅ |
| Ver alertas | ✅ | ✅ | ✅ |
| Ver dashboard | ✅ | ✅ | ✅ |
| Ver reportes | ❌ | ✅ | ✅ |
| Gestionar usuarios | ❌ | ❌ | ✅ |

---

## Estructura del proyecto

```
stockapp/
├── app/
│   ├── (auth)/login/          # Página de login
│   ├── (dashboard)/           # Layout autenticado
│   │   ├── dashboard/         # Dashboard con KPIs y gráficos
│   │   ├── products/          # Productos y categorías
│   │   ├── movements/         # Movimientos de stock
│   │   ├── alerts/            # Alertas de stock bajo
│   │   ├── reports/           # Reportes y exportación
│   │   └── users/             # Gestión de usuarios
│   └── api/                   # API Routes (Next.js)
├── components/
│   ├── shared/                # Componentes reutilizables
│   ├── charts/                # Gráficos (Recharts)
│   ├── products/              # UI de productos
│   ├── movements/             # UI de movimientos
│   ├── alerts/                # UI de alertas
│   ├── dashboard/             # UI del dashboard
│   ├── reports/               # UI de reportes
│   └── users/                 # UI de usuarios
├── lib/
│   ├── auth/                  # Configuración de NextAuth
│   ├── db/                    # Cliente Prisma (singleton)
│   ├── validations/           # Schemas Zod
│   ├── utils/                 # Utilidades (cn, formatCurrency, etc.)
│   └── csv-export.ts          # Exportación CSV
├── prisma/
│   ├── schema.prisma          # Esquema de la base de datos
│   └── seed.ts                # Datos de ejemplo
├── types/
│   ├── index.ts               # Tipos e interfaces globales
│   └── next-auth.d.ts         # Extensión de tipos de NextAuth
└── proxy.ts                   # Middleware de protección de rutas
```

---

## Despliegue en producción

### Consideraciones

1. **Base de datos:** SQLite es adecuado para uso interno o equipos pequeños. Para mayor concurrencia, migrá a PostgreSQL actualizando el `provider` en `prisma/schema.prisma`.

2. **Variables de entorno de producción:**
   ```env
   DATABASE_URL="file:./prod.db"
   NEXTAUTH_URL="https://tu-dominio.com"
   NEXTAUTH_SECRET="clave-aleatoria-segura-de-32-caracteres"
   ```

3. **Compilar y arrancar:**
   ```bash
   npm run build
   npm run start
   ```

4. **Servidor recomendado:** Vercel, Railway, Render o cualquier VPS con Node.js 18+.

---

## Seguridad

- Contraseñas hasheadas con **bcrypt** (12 rounds)
- Validación de entrada con **Zod** en todos los endpoints
- **RBAC** en 3 niveles: middleware, API routes y UI
- Headers HTTP de seguridad: CSP, X-Frame-Options, X-Content-Type-Options
- Audit log inmutable de todas las acciones sensibles
- Movimientos no eliminables, solo anulables con motivo obligatorio
- Protección contra auto-degradación de rol y auto-desactivación del Admin

---

## Licencia

Proyecto privado — todos los derechos reservados.
