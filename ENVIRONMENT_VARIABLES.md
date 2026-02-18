# Variables de Entorno - Manso Club (Seguridad Implementada)

## 🔴 ALTO 2 - Variables de Entorno Nuevas Requeridas en Vercel

### Variables Críticas de Mercado Pago
```
MP_WEBHOOK_SECRET=your_webhook_secret_from_mercado_pago
```

**Cómo obtener MP_WEBHOOK_SECRET:**
1. Ir a Dashboard de Mercado Pago > Integrations > Webhooks
2. Copiar el "Webhook Secret" que se muestra allí
3. Agregarlo como variable de entorno en Vercel

### Variables Existentes (sin cambios)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SITE_URL=https://manso.club
```

## 📋 Configuración en Supabase (Base de Datos)

### Valores requeridos en tabla `configuracion`:
```sql
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('mp_access_token', 'TEST-xxxxxxxxx', 'Access Token de Mercado Pago'),
('mp_modo_sandbox', 'true', 'Usar sandbox de Mercado Pago'),
('mp_webhook_secret', 'your_webhook_secret', 'Webhook Secret de Mercado Pago'),
('precio_membresia', '1500', 'Precio de la membresía en ARS');
```

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
