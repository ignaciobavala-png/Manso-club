# API Routes — Catálogo de Endpoints

**Directorio:** `app/api/`

16 endpoints. Todos usan Route Handlers de Next.js App Router.

---

## Autenticación y sesión

### `GET /api/auth/session`

**Archivo:** `app/api/auth/session/route.ts`

| Detalle | Valor |
|---------|-------|
| Auth | Cookies de sesión |
| Respuesta | `{ authenticated, user: { id, email } }` |

Devuelve el estado de sesión actual.

---

## Checkout

### `GET /api/checkout/config`

**Archivo:** `app/api/checkout/config/route.ts`

| Detalle | Valor |
|---------|-------|
| Auth | Ninguna (público) |
| DB | `checkout_config` (single row) |
| Respuesta | `{ success, config: { banco_nombre, banco_cbu, banco_alias, banco_titular, banco_cuit, moneda } }` |

Usado por `/checkout` para mostrar datos bancarios.

### `POST /api/checkout/config`

**Archivo:** `app/api/checkout/config/route.ts`

| Detalle | Valor |
|---------|-------|
| Auth | Admin (cookie) |
| DB | `checkout_config` UPSERT |
| Propósito | Guardar configuración de checkout desde el admin |

### `POST /api/checkout/notify`

**Archivo:** `app/api/checkout/notify/route.ts:1-100`

| Detalle | Valor |
|---------|-------|
| Auth | Ninguna (service_role) |
| DB | `pedidos` INSERT |
| Body | `{ mensaje, cliente: { nombre, mail, telefono, dni, direccion }, productos, total, config }` |
| Respuesta | `{ success, pedido_id }` |

Guarda el pedido con estado `pendiente_pago`. Usa `SUPABASE_SERVICE_ROLE_KEY` para evitar validación de RLS.

---

## Pedidos (admin)

### `GET /api/pedidos`

**Archivo:** `app/api/pedidos/route.ts`

| Detalle | Valor |
|---------|-------|
| Auth | Admin |
| DB | `pedidos` SELECT all |
| Propósito | Listar todos los pedidos en el dashboard admin |

### `DELETE /api/pedidos/[id]`

**Archivo:** `app/api/pedidos/[id]/route.ts`

| Detalle | Valor |
|---------|-------|
| Auth | Admin |
| DB | `pedidos` DELETE WHERE id |
| Propósito | Eliminar un pedido |

### `PATCH /api/pedidos/[id]/estado`

**Archivo:** `app/api/pedidos/[id]/estado/route.ts`

| Detalle | Valor |
|---------|-------|
| Auth | Admin |
| DB | `pedidos` UPDATE estado |
| Propósito | Cambiar estado de un pedido |

---

## Órdenes y tickets

### `GET /api/orden/[id]`

**Archivo:** `app/api/orden/[id]/route.ts`

| Detalle | Valor |
|---------|-------|
| Auth | Ninguna (público por ID) |
| DB | `ordenes` SELECT con `tickets` anidados |
| Respuesta | Orden con sus tickets asociados |

### `GET /api/ticket/download/[codigo]`

**Archivo:** `app/api/ticket/download/[codigo]/route.ts`

| Detalle | Valor |
|---------|-------|
| Auth | Ninguna (público por código) |
| DB | `tickets` SELECT por código |
| Respuesta | Imagen PNG generada con `canvas` |
| Headers | `Content-Type: image/png`, `Content-Disposition: attachment` |

Genera un PNG del ticket para descarga.

---

## Revalidación ISR

### `POST /api/revalidate`

**Archivo:** `app/api/revalidate/route.ts:1-44`

| Detalle | Valor |
|---------|-------|
| Auth | `Authorization: Bearer ${CRON_SECRET}` |
| Body | `{ table?: string }` |
| Respuesta | `{ revalidated: true, paths, timestamp }` |

Revalida rutas por tabla (según `TABLE_PATHS`) o todas si no se especifica tabla.

### `POST /api/revalidate-admin`

**Archivo:** `app/api/revalidate-admin/route.ts`

| Detalle | Valor |
|---------|-------|
| Auth | Admin |
| Propósito | Disparar revalidación desde el dashboard |

### `POST /api/revalidate-internal`

**Archivo:** `app/api/revalidate-internal/route.ts`

| Detalle | Valor |
|---------|-------|
| Auth | Sin verificación externa |
| Propósito | Revalidación genérica por path |

---

## Utilidades

### `POST /api/newsletter`

**Archivo:** `app/api/newsletter/route.ts:1-29`

| Detalle | Valor |
|---------|-------|
| Auth | Ninguna (service_role) |
| DB | `newsletter_suscriptores` INSERT |
| Body | `{ email }` |
| Validación | Regex email |
| Dedup | Error code `23505` → retorna `{ ok: true }` igual |

Usado por `Newsletter.tsx` en la home.

### `GET /api/dolar`

**Archivo:** `app/api/dolar/route.ts`

| Detalle | Valor |
|---------|-------|
| Auth | Ninguna |
| Fuente | `dolarapi.com` (proxy) |
| Cache | 5 minutos |
| Respuesta | Tasa de dólar blue ARS |

Usado por `CurrencyToggle` para convertir precios ARS/USD.

### `GET /api/cron/ping`

**Archivo:** `app/api/cron/ping/route.ts`

| Detalle | Valor |
|---------|-------|
| Auth | `CRON_SECRET` |
| Propósito | Vercel Cron — evita cold starts de Supabase |

### `POST /api/setup-about-us`

**Archivo:** `app/api/setup-about-us/route.ts`

| Detalle | Valor |
|---------|-------|
| Auth | Ninguna |
| DB | Crea tabla `about_us` con datos iniciales |
| Propósito | One-time setup utility |

---

## Resumen por método HTTP

| Método | Endpoints |
|--------|-----------|
| GET | `/api/auth/session`, `/api/checkout/config`, `/api/pedidos`, `/api/orden/[id]`, `/api/ticket/download/[codigo]`, `/api/dolar`, `/api/cron/ping` |
| POST | `/api/checkout/config`, `/api/checkout/notify`, `/api/revalidate`, `/api/revalidate-admin`, `/api/revalidate-internal`, `/api/newsletter`, `/api/setup-about-us` |
| DELETE | `/api/pedidos/[id]` |
| PATCH | `/api/pedidos/[id]/estado` |

## Resumen por nivel de auth

| Auth | Endpoints |
|------|-----------|
| Ninguna (público) | `/api/checkout/config` (GET), `/api/orden/[id]`, `/api/ticket/download/[codigo]`, `/api/dolar`, `/api/setup-about-us` |
| Service role | `/api/checkout/notify`, `/api/newsletter` |
| Admin (cookie/RPC) | `/api/checkout/config` (POST), `/api/pedidos` todos, `/api/revalidate-admin` |
| CRON_SECRET | `/api/revalidate`, `/api/cron/ping` |
| Sesión | `/api/auth/session` |
