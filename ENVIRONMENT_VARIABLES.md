# Variables de Entorno - Manso Club (Seguridad Implementada)

## 📧 Mailing (Resend) — pendiente de activar

```
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=Manso Club <hola@mansoclub.com.ar>
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxx
```

**Estado:** cuenta creada (`devops@mansoclub.com.ar`), dominio `mansoclub.com.ar` **aún sin verificar** en Resend.
Hasta verificar el dominio, `lib/resend.ts` usa `onboarding@resend.dev` como remitente por defecto —
no hace falta cargar `RESEND_FROM_EMAIL` todavía.

**Pasos para activar cuando se verifique el dominio:**
1. Verificar dominio (o subdominio) en resend.com/domains, cargando los DNS en Hostinger
2. Copiar el API key desde el dashboard de Resend → cargar `RESEND_API_KEY` en Vercel
3. Cargar `RESEND_FROM_EMAIL` con el remitente definitivo (ej. `Manso Club <hola@mansoclub.com.ar>`)
4. Templates en `emails/` (preview local: `pnpm email`)

**Webhook de estado de entrega** (`RESEND_WEBHOOK_SECRET`):
- Endpoint: `app/api/mailing/webhook/route.ts` — recibe eventos `email.delivered`/`email.bounced`/`email.complained`/`email.failed` y actualiza `mailing_envios.estado`
- Se registra en resend.com/webhooks (o vía `resend.webhooks.create()`) apuntando a `https://<dominio-de-producción>/api/mailing/webhook`, suscripto a esos 4 eventos
- Resend devuelve un `signing_secret` al crear el webhook — ese valor es `RESEND_WEBHOOK_SECRET`
- Requiere que el sitio esté desplegado en una URL pública (no funciona con `localhost`)

## 🔴 ALTO 2 - Variables de Entorno Nuevas Requeridas en Vercel

### Variables Críticas de Mercado Pago
```
MP_ACCESS_TOKEN=APP_USR-xxxxxxxxx     # credencial de producción (obligatoria)
MP_PUBLIC_KEY=APP_USR-xxxxxxxxx       # solo si se usa Checkout Bricks en el front
MP_WEBHOOK_SECRET=xxxxxxxxx           # obligatoria para acreditar pagos
```

Las credenciales viven **en variables de entorno de Vercel**, no en la tabla `configuracion`.
Después de cargarlas hace falta un redeploy: Vercel no las inyecta en un deployment ya corriendo.

**Cómo obtener las credenciales:**
1. mercadopago.com.ar/developers/panel/app → aplicación de Manso Club
2. "Credenciales de producción" → copiar el *Access Token* (`APP_USR-...`)
3. Sección "Webhooks" → registrar `https://manso.club/api/mp/webhook`, evento `payment`
4. Copiar el *Webhook Secret* que devuelve al crear el webhook

**Sin `MP_WEBHOOK_SECRET` el webhook rechaza todas las notificaciones** (`app/api/mp/webhook/route.ts`
falla cerrado a propósito: sin secreto no se puede verificar la firma). El checkout funciona y el
cliente puede pagar, pero el pedido queda en `pendiente_pago` hasta confirmarlo a mano.

### Variables Existentes (sin cambios)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SITE_URL=https://manso.club
```

## 💵 Moneda: precios en USD, cobro en ARS

Los precios de `productos.precio` están cargados **en dólares**. Mercado Pago cobra en ARS, así que
la conversión se hace con el dólar blue (`https://dolarapi.com/v1/dolares/blue`, vía `lib/dolar.ts`).

La cotización se resuelve **siempre en el servidor** (`create-preference` y `checkout/notify`).
Nunca se acepta un precio ni una cotización enviados por el navegador: si vinieran del cliente,
cualquiera podría editarlos para pagar menos. Si la API del dólar no responde, el pago se bloquea
en lugar de cobrar un monto incorrecto.

Cada pedido guarda `total_usd`, `cotizacion_dolar` y `moneda_origen` para poder auditar después
con qué cotización se cobró.

## 🔐 Implementaciones de Seguridad Realizadas

### ✅ CRÍTICO 1 - RLS en Tablas de Pagos
- **Archivo:** `/supabase/migration_pagos_rls.sql`
- **Tablas protegidas:** ordenes, orden_items, tickets, configuracion
- **Políticas implementadas:**
  - `ordenes`: INSERT público, SELECT dueño, admin full access
  - `orden_items`: INSERT público, admin full access  
  - `tickets`: SELECT por código público, admin full access
  - `configuracion`: Solo admin full access

### ✅ CRÍTICO 2 - Verificación Firma Webhook MP
- **Archivo:** `/app/api/mp/webhook/route.ts`
- **Implementación:** HMAC-SHA256 con x-signature
- **Validación:** Manifest = `id:{id};request-id:{x-request-id};ts:{ts};`
- **Requiere:** `MP_WEBHOOK_SECRET` en configuración

### ✅ CRÍTICO 3 - Validación de Precios Backend
- **Archivo:** `/app/api/mp/create-preference/route.ts`
- **Validación:** Consulta precios reales desde Supabase
- **Tipos soportados:** productos, membresias, entradas
- **Rechaza:** Discrepancias de precios > 0.01 ARS

### ✅ ALTO 1 - Rate Limiting
- **Archivo:** `/lib/rate-limit.ts`
- **Endpoints protegidos:**
  - `/api/mp/create-preference`: 10 req/minuto por IP
  - `/api/mp/webhook`: 100 req/minuto por IP
- **Headers:** `X-RateLimit-*` en respuestas

## 🚀 Pasos para Producción

1. **Ejecutar migration SQL en Supabase:**
   ```bash
   # Copiar contenido de /supabase/migration_pagos_rls.sql
   # Pegar en Supabase Dashboard > SQL Editor
   # Ejecutar
   ```

2. **Configurar variables en Vercel:**
   ```bash
   # Agregar MP_WEBHOOK_SECRET en Vercel Dashboard > Settings > Environment Variables
   ```

3. **Configurar webhook en Mercado Pago:**
   ```
   URL: https://manso.club/api/mp/webhook
   Events: payment
   Secret: (el mismo que MP_WEBHOOK_SECRET)
   ```

4. **Verificar configuración:**
   ```bash
   npm run build
   npm run dev
   # Probar endpoint de pagos
   ```

## 🔍 Verificación de Seguridad

- ✅ Build sin errores
- ✅ TypeScript estricto
- ✅ Políticas RLS implementadas
- ✅ Validación de firma webhook
- ✅ Validación de precios backend
- ✅ Rate limiting activo
- ✅ Headers de seguridad incluidos

## 📞 Soporte

Para cualquier problema con la configuración:
1. Revisar logs de Vercel
2. Verificar configuración en Supabase
3. Validar variables de entorno
4. Probar con modo sandbox primero
