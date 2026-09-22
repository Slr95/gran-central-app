# Gran Central

Tienda online (App Router) para vender colchones, sommiers y almohadas en Argentina: catálogo con variantes, carrito, checkout, panel de admin y pagos.

Demo: [gran-central-app.vercel.app](https://gran-central-app.vercel.app)

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind)
- **Neon** + **Prisma 7** (`@prisma/adapter-pg`)
- **Auth.js** v5 — login con email/contraseña y roles `ADMIN` / `CUSTOMER`
- **Mercado Pago Checkout Pro**
- **Cloudinary** — subida firmada de fotos desde el navegador

## Qué hace la tienda

El cliente entra, recorre **Colchones**, **Sommiers**, **Almohadas** u **Ofertas**, abre una ficha (medidas, precio, fotos) y agrega al carrito. En checkout elige envío (retiro, flete o correo; colchón/sommier no van por correo) y paga por transferencia (con descuento) o Mercado Pago.

El admin entra a `/admin` y carga productos, fotos, stock, pedidos y datos de la tienda (CBU/WhatsApp van ahí, no en el código).

## Cómo se usa

**En el demo:** [gran-central-app.vercel.app](https://gran-central-app.vercel.app) — recorré categorías, abrí un producto, agregalo al carrito y registrate en `/registro` para llegar al checkout.

**En local** (después de `npm run db:seed`):

| Rol   | Email                      | Contraseña       |
| ----- | -------------------------- | ---------------- |
| Admin | `admin@grancentral.com.ar` | `DemoAdmin2026!` |

Con esa cuenta entras a `/admin` (productos, fotos, pedidos, CBU/WhatsApp). Un cliente se crea en `/registro`. Son credenciales de **demo**, no de un comercio real: no hay CBU ni tokens en este README.

Esa clave de admin la crea el seed **solo si el usuario no existía**.

## Cómo correrlo en local

Hace falta Node 22+ y una base Postgres (Neon alcanza).

```bash
git clone https://github.com/Slr95/gran-central-app.git
cd gran-central-app
npm install
cp .env.example .env
```

Completá `.env` (ver abajo), después:

```bash
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). El admin de demo es el de la tabla de arriba.

## Variables de entorno

Todo lo sensible va en `.env` (gitignored) o en el dashboard de Vercel. En el repo solo está `.env.example`, con placeholders vacíos.

| Variable | Para qué |
| --- | --- |
| `DIRECT_URL` / `DATABASE_URL` | Neon. La app usa `DIRECT_URL` (sin pooler) |
| `AUTH_SECRET` | `npx auth secret` |
| `MP_ACCESS_TOKEN` | Access token de **prueba** de Mercado Pago |
| `MP_WEBHOOK_SECRET` | Firma del webhook |
| `CLOUDINARY_*` | Cloud name, API key y secret |
| `NEXT_PUBLIC_SITE_URL` | URL pública (callbacks de pago) |

CBU, alias y WhatsApp **no van en Git ni en el `.env`**. Se cargan en el panel (`/admin/configuracion`) y viven en la base. En este demo están vacíos a propósito.

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | `prisma generate` + build de Next |
| `npm run db:seed` | Categorías, productos de demo y admin |
| `npm run lint` / `npm run typecheck` | ESLint y `tsc` |

## Decisiones de diseño

- Colchón y sommier van como bulto grande: en checkout no se ofrece correo.
- Las fotos se firman en el server y el browser sube directo a Cloudinary (límite de body en serverless).
- Prisma 7 habla con Neon por el adapter `pg`, no por el pooler: el pooler corta `$transaction` y el DDL de las migraciones.

## Qué no está en este repo

Tokens de Mercado Pago, secretos de Cloudinary, connection strings, CBU ni WhatsApp. Si clonás el proyecto, usá credenciales de **prueba** y una base tuya.
