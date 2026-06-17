# Auth — Login, Registro, Recuperar, Actualizar, Callback

**Archivos fuente:**
- Login: `app/login/page.tsx:1-108`, `app/login/actions.ts:1-36`
- Registro: `app/registro/page.tsx:1-112`, `app/registro/actions.ts`
- Recuperar: `app/recuperar-contrasena/page.tsx:1-91`
- Actualizar: `app/actualizar-contrasena/page.tsx:1-144`
- Callback: `app/auth/callback/route.ts:1-29`
- OAuth: `components/GoogleSignInButton.tsx`
- Middleware: `middleware.ts:1-109`

---

## `/login` — Inicio de sesión

### Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Client component con `<Suspense>` |
| Layout | `robots: { index: false }` + `app/login/layout.tsx` |
| SEO | Bloqueado |

### Formulario

Campos: email + password. Usa `useState` local, no `useActionState`.

Submit → `loginAction` (server action):

```typescript
// app/login/actions.ts:6-36
loginAction(formData):
  1. signInWithPassword(email, password)
  2. Si error → return { error: 'Email o contraseña incorrectos' } // sanitizado
  3. get_user_role(user.id)
  4. Si admin → redirect('/mansoadm')
  5. Si no → redirect(from || '/mi-cuenta')
```

El parámetro `from` (query string) permite redirigir al usuario a la página que intentaba visitar. Validación: `path.startsWith('/') && !path.startsWith('//')`.

### UI

- Logo "Manso_" con cursor blink
- Mensaje de error (rojo, centrado)
- Link "¿Olvidaste tu contraseña?" → `/recuperar-contrasena`
- Separador "o"
- `GoogleSignInButton` para OAuth
- Link "Crear cuenta" → `/registro`

---

## `/registro` — Crear cuenta

### Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Client component |
| Estado | `useActionState(registroAction, null)` |

### Formulario

Campos: `display_name`, `email`, `password` (con toggle show/hide, mínimo 8 caracteres).

Submit → `registroAction` (server action, en `app/registro/actions.ts`):
- Crea usuario en Supabase Auth
- Crea perfil en `user_profiles`
- Envía email de confirmación

### Estados

| Estado | UI |
|--------|-----|
| Formulario | Campos + Google OAuth + link a login |
| `state.error` | Banner rojo con mensaje |
| `state.confirmacion` | Ícono de email + "Revisá tu email" + link a login |
| `pending` | Botón "Creando cuenta..." deshabilitado |

### UI

- Logo `/manso.png` + "Crear cuenta_" con cursor blink
- "Comunidad Manso" debajo del título
- Google OAuth (mismo `GoogleSignInButton`)
- Link "¿Ya tenés cuenta?" → `/login`

---

## `/recuperar-contrasena` — Olvidé mi contraseña

### Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Client component |
| Método | `supabase.auth.resetPasswordForEmail()` directo (no server action) |

### Flujo

1. Usuario ingresa email
2. `supabase.auth.resetPasswordForEmail(email, { redirectTo: '.../auth/callback' })`
3. Supabase envía email con link mágico
4. UI muestra confirmación: "Te enviamos un link a {email}"
5. Link en el email → `/auth/callback?code=XXX&type=recovery`

### UI

- Logo + "Manso_" + "Recuperar contraseña"
- Texto explicativo
- Input email
- Botón "Enviar link"
- Link "Volver al login"

**Nota de seguridad:** `redirectTo` apunta correctamente a `/auth/callback` (no a `/actualizar-contrasena` directo). Ver `auditoria-login.md` issue #9 para el server action alternativo que tenía el bug.

---

## `/actualizar-contrasena` — Nueva contraseña

### Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Client component con `<Suspense>` |
| Protección | Verifica `?recovery=1` y sesión activa |

### Flujo

1. Valida `searchParams.get('recovery') === '1'` — si no, cierra sesión y muestra error
2. Verifica `supabase.auth.getSession()` — si no hay sesión, muestra "link inválido o expiró"
3. Si hay sesión: formulario de nueva contraseña + confirmación
4. Submit → `supabase.auth.updateUser({ password })`
5. Si éxito → `set_password_reset_pending(false)` vía RPC + `signOut()` → redirect a `/login` en 3s

### Estados

| Estado | UI |
|--------|-----|
| `checking === true` | "Verificando..." |
| Sin sesión | "El link es inválido o expiró" + botón a recuperar |
| Formulario | Nueva contraseña + confirmar + "Guardar contraseña" |
| `success === true` | "¡Contraseña actualizada! Redirigiendo al login..." |

### Protección del middleware

```typescript
// middleware.ts:52-58
if (user && !isActualizarContrasenaRoute) {
  const { data: pending } = await supabase.rpc('get_password_reset_pending', { user_id: user.id });
  if (pending === true) {
    return NextResponse.redirect(new URL('/actualizar-contrasena?recovery=1', request.url));
  }
}
```

El middleware fuerza al usuario a cambiar la contraseña si `password_reset_pending = true`. Una vez cambiada, el flag se limpia y el usuario puede navegar normalmente.

---

## `/auth/callback` — Callback de autenticación

### Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Route handler (`route.ts`) |
| Método | GET |

### Flujo

```typescript
// app/auth/callback/route.ts:1-29
GET(request):
  1. Lee code y type de searchParams
  2. exchangeCodeForSession(code) → crea cookies de sesión
  3. Si type === 'recovery':
     - set_password_reset_pending(true) vía RPC
     - redirect → /actualizar-contrasena?recovery=1
  4. Si no (signup, email_change, OAuth):
     - get_user_role(user.id)
     - Si admin → /mansoadm
     - Si no → /mi-cuenta
  5. Si error o sin code → redirect /recuperar-contrasena?error=link-invalido
```

Este endpoint maneja **todos** los callbacks de Supabase Auth:
- Confirmación de email (signup)
- Cambio de email (email_change)
- Recuperación de contraseña (recovery)
- OAuth (Google)

---

## Google OAuth

**Componente:** `components/GoogleSignInButton.tsx`

Usado en `/login` y `/registro`. Llama a:

```typescript
supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${origin}/auth/callback` }
})
```

El callback de OAuth también pasa por `/auth/callback`, donde `exchangeCodeForSession` crea la sesión y redirige según el rol.

---

## Flujo completo de auth

```
Registro:
  /registro → registroAction() → user_profiles INSERT
  → email de confirmación → click link
  → /auth/callback?code=XXX&type=signup
  → exchangeCodeForSession → redirect /mi-cuenta

Login email:
  /login → loginAction() → signInWithPassword
  → redirect /mansoadm (admin) o /mi-cuenta (user)

Login Google:
  /login → GoogleSignInButton → signInWithOAuth
  → Google OAuth → /auth/callback?code=XXX
  → exchangeCodeForSession → redirect según rol

Recuperación:
  /recuperar-contrasena → resetPasswordForEmail
  → email con link → /auth/callback?code=XXX&type=recovery
  → exchangeCodeForSession + set_password_reset_pending(true)
  → /actualizar-contrasena?recovery=1
  → usuario cambia contraseña → signOut → redirect /login

Middleware:
  Todas las rutas protegidas → verifica sesión y rol
  /login + /registro → si ya tiene sesión, redirige según rol
  /mi-cuenta → requiere sesión
  /mansoadm/* → requiere sesión + rol admin
  password_reset_pending → fuerza /actualizar-contrasena
```

## DB involucrada

| Tabla/Recurso | Operación | Dónde |
|---------------|-----------|-------|
| Supabase Auth | `signInWithPassword` | login/actions.ts |
| Supabase Auth | `signUp` | registro/actions.ts |
| Supabase Auth | `resetPasswordForEmail` | recuperar-contrasena/page.tsx |
| Supabase Auth | `updateUser({ password })` | actualizar-contrasena/page.tsx |
| Supabase Auth | `exchangeCodeForSession` | auth/callback/route.ts |
| Supabase Auth | `signInWithOAuth` | GoogleSignInButton.tsx |
| `user_profiles` | SELECT (rol) | login/actions.ts, auth/callback |
| `user_profiles` | INSERT | registro/actions.ts |
| RPC `get_user_role` | SELECT | login/actions.ts, auth/callback, middleware |
| RPC `get_password_reset_pending` | SELECT | middleware |
| RPC `set_password_reset_pending` | UPDATE | auth/callback, actualizar-contrasena |

## Relación con otros docs

- Auditoría de seguridad con 14 issues — `seguridad/auditoria-login.md`
- Middleware y protección de rutas — `sistemas/autenticacion.md`
