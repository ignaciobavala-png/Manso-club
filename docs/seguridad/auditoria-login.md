# Auditoría Completa de Auth — Manso Club

**Fecha:** 2026-06-09
**Alcance:** Auth, Recovery, RLS, Middleware, Flujo de contraseñas

---

## Resumen

| Severidad | Cantidad |
|-----------|----------|
| 🔴 Crítica | 4 |
| 🟡 Alta    | 4 |
| 🟡 Media   | 3 |
| 🟢 Baja    | 3 |

---

## 🔴 CRÍTICO #1 — El recovery mail permite entrar al usuario sin cambiar la contraseña

**Archivos involucrados:**
- `app/auth/callback/route.ts` — callback de intercambio de código
- `app/actualizar-contrasena/page.tsx` — página de cambio de contraseña
- `middleware.ts` — matcher y protección de rutas

**Raíz del bug:**

En el callback `/auth/callback`, `exchangeCodeForSession(code)` **crea una sesión completa con cookies** apenas el usuario hace clic en el link del mail. El usuario YA está autenticado antes de llegar a la página de cambio de contraseña. Puede cerrar la pestaña, abrir otra, ir a `/mi-cuenta` y entrar sin haber cambiado nada.

La página `actualizar-contrasena` verifica `?recovery=1` y `getSession()`, pero es solo client-side. Nada en el servidor impide que el usuario navegue a cualquier ruta protegida porque las cookies de sesión ya están puestas.

El middleware **no incluye** `/actualizar-contrasena` ni `/auth/callback` en su matcher (`middleware.ts:89-98`). No hay verificación server-side que obligue al cambio de contraseña.

**Flujo actual (roto):**

```
Usuario pide recovery → mail con link a /auth/callback?code=xxx
→ exchangeCodeForSession() → SESIÓN CREADA (cookies puestas)
→ redirect a /actualizar-contrasena?recovery=1
→ Usuario puede cerrar pestaña y entrar a /mi-cuenta sin cambiar contraseña ✓
```

**Flujo esperado:**

```
Usuario pide recovery → mail con link a /auth/callback?code=xxx
→ exchangeCodeForSession() → marcar password_reset_pending = true
→ redirect a /actualizar-contrasena?recovery=1
→ Middleware: si password_reset_pending y ruta != /actualizar-contrasena → redirect forzoso
→ Usuario cambia contraseña → password_reset_pending = false → signOut()
→ Usuario vuelve a loginear con nueva contraseña
```

**Solución:**

1. Agregar columna `password_reset_pending BOOLEAN DEFAULT false` a `user_profiles`
2. En `auth/callback/route.ts`, después de `exchangeCodeForSession`, llamar RPC `set_password_reset_pending(true)`
3. En `middleware.ts`, verificar ese flag en cada request autenticado. Si `true` y path `!= /actualizar-contrasena`, redirigir a `/actualizar-contrasena?recovery=1`
4. En `actualizar-contrasena/page.tsx`, tras `updateUser({ password })` exitoso, llamar RPC `set_password_reset_pending(false)` y luego `signOut()`
5. Agregar `/actualizar-contrasena` y `/auth/callback` al matcher del middleware

---

## 🔴 CRÍTICO #2 — El callback no discrimina entre `type=recovery`, `type=signup` y `type=email_change`

**Archivo:** `app/auth/callback/route.ts`

**Raíz del bug:**

El callback trata TODOS los códigos de auth igual — siempre redirige a `/actualizar-contrasena?recovery=1`. Supabase envía `type=recovery`, `type=signup` y `type=email_change` en los query params de la URL de callback.

Si un usuario se registra, recibe el mail de confirmación de signup, hace clic en el link que apunta a `/auth/callback` (depende de la configuración en Supabase Dashboard > Authentication > Email Templates), el callback lo manda a la página de "cambiar contraseña" en vez de a un welcome o a `/mi-cuenta`.

**Código actual (línea 5):**
```typescript
const { searchParams, origin } = new URL(request.url);
const code = searchParams.get('code');
// ❌ No se lee searchParams.get('type')
```

**Solución:**

```typescript
const type = searchParams.get('type');

if (code && type === 'recovery') {
  // exchange code → mark password_reset_pending → redirect actualizar-contrasena
}
if (code && type === 'signup') {
  // exchange code → redirect /mi-cuenta?welcome=1
}
// else → redirect /login?error=link-invalido
```

---

## 🔴 CRÍTICO #3 — RLS de órdenes/tickets usa `raw_user_meta_data->>'role'` que NO EXISTE

**Archivo:** `supabase/migration_pagos_rls.sql` (líneas 112-128, 143-159, 174-190, 199-215)

**Raíz del bug:**

Las políticas para `ordenes`, `orden_items`, `tickets` y `configuracion` verifican admin así:

```sql
EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND auth.users.raw_user_meta_data->>'role' = 'admin'
)
```

**Dos errores graves:**

1. **Los roles se guardan en `user_profiles.role`, no en `raw_user_meta_data`.** Estas políticas nunca encuentran un admin → ningún admin puede ver/modificar órdenes, tickets ni configuración desde el dashboard sin usar service_role.
2. **`raw_user_meta_data` es editable por el usuario.** Si los roles estuvieran ahí, cualquier usuario podría auto-promoverse a admin modificando su metadata desde el cliente.

**Solución:**

Reescribir las 4 políticas usando `public.is_admin()`, la función SECURITY DEFINER que ya existe:

```sql
DROP POLICY IF EXISTS "ordenes_admin_all" ON ordenes;
CREATE POLICY "ordenes_admin_all"
  ON ordenes FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
```

Aplicar el mismo patrón a `orden_items`, `tickets` y `configuracion`.

---

## 🔴 CRÍTICO #4 — Admin login action no verifica el rol antes del redirect

**Archivo:** `app/mansoadm/login/actions.ts`

**Raíz del bug:**

El login de admin hace `signInWithPassword` y redirige directo a `/mansoadm` **sin verificar el rol** del usuario. Delega toda la verificación al middleware.

Comparación con el login principal (`app/login/actions.ts:27-30`):

```typescript
// ✅ Login principal — SÍ verifica rol
const { data: role } = await supabase.rpc('get_user_role', { user_id: data.user.id });
if (role === 'admin') redirect('/mansoadm');
redirect('/mi-cuenta');

// ❌ Login admin — NO verifica rol
redirect('/mansoadm');
```

Si por algún motivo el middleware tiene un race condition o las cookies no se propagan a tiempo entre el server action y el redirect, un non-admin podría aterrizar en el dashboard.

**Solución:**

```typescript
const { data: role } = await supabase.rpc('get_user_role', { user_id: data.user.id });
if (role !== 'admin') return { error: 'No tenés permisos de administrador' };
redirect('/mansoadm');
```

---

## 🟡 ALTA #5 — `policies.sql` permite que cualquier usuario autenticado escriba/borre contenido

**Archivo:** `supabase/policies.sql` (líneas 69-83, 96-110, 123-137, 149-164)

**Raíz del bug:**

Las políticas de escritura para `artistas`, `productos`, `eventos_home` y `agenda` usan `WITH CHECK (true)` y `USING (true)`:

```sql
CREATE POLICY "artistas_auth_insert"
  ON artistas FOR INSERT TO authenticated
  WITH CHECK (true);  -- ❌ Cualquier authenticated puede insertar
```

`fix_recursion.sql` sobreescribe estas políticas con versiones que usan `public.is_admin()`, pero **si `policies.sql` se re-ejecuta después** (ej. alguien corre el script de nuevo), se pierde la restricción de admin y cualquier miembro logueado puede modificar todo el contenido.

**Solución:**

Eliminar las políticas "abiertas" de `policies.sql` y consolidar TODAS las políticas en un único script que use `public.is_admin()`. O bien, en `policies.sql` reemplazar los `WITH CHECK (true)` por `WITH CHECK (public.is_admin())`.

---

## 🟡 ALTA #6 — Pedidos RLS hardcodea un email específico

**Archivo:** `supabase/migration_pedidos.sql` (líneas 27-33)

```sql
CREATE POLICY "Solo admin puede gestionar pedidos" ON pedidos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'ana@manso.club'  -- ❌ Hardcodeado
    )
  );
```

Si ese email cambia, se agrega otro admin, o la cuenta se desactiva, la política deja de funcionar.

**Solución:**

```sql
CREATE POLICY "Solo admin puede gestionar pedidos" ON pedidos
  FOR ALL USING (public.is_admin());
```

---

## 🟡 ALTA #7 — Sin rate limiting en login, registro, ni recovery

**Archivos:** `app/login/actions.ts`, `app/registro/actions.ts`, `app/recuperar-contrasena/page.tsx`

No hay protección contra fuerza bruta. Un atacante puede probar contraseñas ilimitadamente contra las 3 rutas.

**Riesgos:**
- Ataque de diccionario contra login
- Spam de recovery mails a cualquier email
- Creación masiva de cuentas fake

**Solución recomendada:**
- Login y registro: rate limiting por IP en middleware o Vercel Edge Config
- Recovery: máximo 3 solicitudes por email en 15 minutos
- Opcional: agregar Turnstile (Cloudflare) o reCAPTCHA

---

## 🟡 ALTA #8 — Admin login expone mensajes de error crudos de Supabase

**Archivo:** `app/mansoadm/login/actions.ts:23`

```typescript
return { error: error.message };  // ❌ Expone errores internos al cliente
```

El login principal sanitiza correctamente (`'Email o contraseña incorrectos'`).

**Solución:**

```typescript
return { error: 'Email o contraseña incorrectos' };
```

---

## 🟡 MEDIA #9 — Redirecciones inconsistentes entre página y server action del recovery

**Archivos:**

- `app/recuperar-contrasena/page.tsx:19` → `redirectTo: ${origin}/auth/callback` (usado, correcto)
- `app/recuperar-contrasena/actions.ts:16` → `redirectTo: ${origin}/actualizar-contrasena` (no usado, roto)

Si alguien usa el server action, el link de recovery apunta directo a `/actualizar-contrasena` sin pasar por `/auth/callback`, por lo que nunca se ejecuta `exchangeCodeForSession` y el usuario no tendrá sesión para cambiar la contraseña.

**Solución:** Eliminar el server action no usado o corregir su `redirectTo` para que apunte a `/auth/callback`.

---

## 🟡 MEDIA #10 — El server action de recovery toma `origin` del form (spoofeable)

**Archivo:** `app/recuperar-contrasena/actions.ts:10`

```typescript
const origin = formData.get('origin') as string;
```

El `origin` se envía desde el cliente en el form. Un atacante podría modificarlo para que el link de recovery apunte a un dominio malicioso.

**Solución:** Derivar el `origin` de los headers del request en el server action, no del form data.

---

## 🟡 MEDIA #11 — `get_user_role` SECURITY DEFINER no verifica quién consulta

**Archivo:** `supabase/fix_middleware_role.sql`

```sql
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role::TEXT FROM public.user_profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;
```

Cualquier cliente autenticado que pueda ejecutar RPC puede consultar el rol de cualquier `user_id`. Aunque el middleware la usa correctamente, la función está expuesta sin restricciones.

**Solución:** Agregar `SET search_path = ''` y opcionalmente verificar que el caller tenga derecho si no se usa desde middleware. Como mitigation mínima:

```sql
ALTER FUNCTION public.get_user_role(user_id UUID) SET search_path = '';
```

---

## 🟢 BAJA #12 — `useUser()` hook no maneja errores de refresh token

**Archivo:** `hooks/useUser.ts:44`

```typescript
supabase.auth.getUser().then(({ data: { user } }) => {
  setUser(user ?? null);
  // ❌ Si el refresh token expiró, el error se traga y user queda null sin feedback
});
```

Si el refresh token expira, `getUser()` lanza error y el usuario aparece como deslogueado sin ninguna indicación de por qué.

**Solución:** Agregar `.catch()` para loguear el error en desarrollo, o manejar el estado de "sesión expirada" para mostrar un mensaje.

---

## 🟢 BAJA #13 — No hay CSRF explícito en formularios de auth

Los formularios de `/recuperar-contrasena` y `/actualizar-contrasena` usan `onSubmit` manual con el browser client de Supabase directamente, sin pasar por Server Actions. Next.js protege Server Actions con headers de origin, pero estos formularios no se benefician de esa protección.

**Solución:** Migrar `/recuperar-contrasena/page.tsx` a usar Server Action en vez de `supabase.auth.resetPasswordForEmail` directo.

---

## 🟢 BAJA #14 — Email template usa `{{ .ConfirmationURL }}` (verificar en dashboard)

**Archivo:** `supabase/email-templates/reset-password.html:44`

Esto es correcto para Supabase, pero hay que verificar en el dashboard que:
1. El template esté efectivamente cargado en Supabase Authentication > Email Templates
2. El `redirectTo` configurado en el código coincida con la URL de sitio configurada en Supabase Auth > Settings

---

## Hardening Adicional Recomendado (fuera del scope de bugs)

1. **Sesiones**: Configurar JWT expiry corto (1h) en Supabase Auth settings para minimizar ventana de tokens robados
2. **Auditoría**: Agregar columna `last_login_at` a `user_profiles` y poblarla en el login action
3. **Lockout**: Después de N intentos fallidos de login, bloquear temporalmente (en `user_profiles` o vía Supabase Auth hooks)
4. **2FA**: Evaluar agregar MFA para cuentas admin por Supabase Auth MFA
5. **Logs**: Agregar logging de eventos de auth (login exitoso, fallido, recovery solicitado, password cambiada) en tabla `auth_logs`
6. **Cookies**: Configurar `SameSite=Strict` y `Secure=true` en producción

---

## Plan de Acción por Fases

| Fase | Issues | Archivos a modificar | Tipo |
|------|--------|---------------------|------|
| **Fase 1: Recovery Fix** | #1, #2 | `auth/callback/route.ts`, `middleware.ts`, `actualizar-contrasena/page.tsx`, migration SQL | Código + DB |
| **Fase 2: RLS Hardening** | #3, #4, #5, #6 | `migration_pagos_rls.sql`, `migration_pedidos.sql`, `policies.sql`, `mansoadm/login/actions.ts` | SQL + Código |
| **Fase 3: Hardening General** | #7, #8, #9, #10, #11 | `login/actions.ts`, `recuperar-contrasena/*`, `mansoadm/login/actions.ts`, `fix_middleware_role.sql` | Código + SQL |
| **Fase 4: Low Priority** | #12, #13, #14 | `hooks/useUser.ts`, `recuperar-contrasena/page.tsx`, Supabase Dashboard | Código + Config |
