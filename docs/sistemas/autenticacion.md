# Autenticación — Middleware, Supabase SSR, Roles

**Archivos fuente:**
- Middleware: `middleware.ts:1-109`
- Clientes Supabase: `lib/supabase.ts:1-53`
- Hook de usuario: `hooks/useUser.ts:1-67`
- Login action: `app/login/actions.ts:1-36`
- Auth callback: `app/auth/callback/route.ts:1-29`

## Middleware

### Configuración

```typescript
// middleware.ts:100-108
matcher: [
  '/mansoadm/:path*',
  '/login',
  '/registro',
  '/mi-cuenta/:path*',
  '/mi-cuenta',
  '/actualizar-contrasena',
]
```

**No** incluye `/streaming` — el acceso lo controla la página internamente.

### Flujo de decisión

```typescript
// middleware.ts:4-98
1. Obtiene sesión con supabase.auth.getUser()
2. password_reset_pending? → fuerza /actualizar-contrasena
3. /login con sesión? → redirect según rol
4. /registro con sesión? → redirect /mi-cuenta
5. /mi-cuenta sin sesión? → redirect /login?from=
6. /mansoadm/* sin sesión? → redirect /login
7. /mansoadm/* sin rol admin? → redirect /mi-cuenta
8. /mansoadm/login legacy → redirect /login
```

### Verificación de rol admin

```typescript
// middleware.ts:45-48
getUserRole(userId):
  supabase.rpc('get_user_role', { user_id: userId })
```

La función RPC `get_user_role` consulta `user_profiles.role`. Es SECURITY DEFINER.

### Password reset pending

```typescript
// middleware.ts:52-58
if (user && !isActualizarContrasenaRoute) {
  const pending = await supabase.rpc('get_password_reset_pending', { user_id: user.id });
  if (pending) redirect('/actualizar-contrasena?recovery=1');
}
```

El flag `password_reset_pending` se setea en `/auth/callback` cuando `type=recovery` y se limpia en `/actualizar-contrasena` tras cambiar la contraseña.

## Clientes Supabase (`lib/supabase.ts`)

Tres tipos de cliente para diferentes contextos:

### 1. Browser client

```typescript
// lib/supabase.ts:8
export const supabase = createBrowserClient(url, anonKey);
```

Para client components. Singleton exportado. Usa las cookies del navegador automáticamente.

### 2. Server client

```typescript
// lib/supabase.ts:11-37
export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => { /* ... */ },
    },
  });
}
```

Para server components y API routes. Lee/escribe cookies del request. El `setAll` tiene try/catch porque falla en Server Components (donde no se pueden setear cookies — esto es esperado).

### 3. Anonymous client

```typescript
// lib/supabase.ts:42-53
export function createSupabaseAnon() {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```

Para fetch de datos públicos desde server components. **No interactúa con cookies ni sesiones.** Esto evita errores de `AuthApiError` cuando hay refresh tokens expirados en las cookies pero el server component solo necesita datos públicos.

## Hook useUser (`hooks/useUser.ts`)

### Comportamiento

```typescript
// hooks/useUser.ts:16-67
```

1. **En cada navegación** (`useEffect` con `[pathname]`): re-verifica `supabase.auth.getUser()`
2. **En auth pages** (`/login`, `/registro`, etc.): limpia estado y no fetchea
3. **Listener de auth state**: `supabase.auth.onAuthStateChange()` para cambios client-side

### Datos que expone

```typescript
return { user, profile, role, loading };
```

- `user`: objeto `User` de Supabase Auth
- `profile`: `{ display_name, email, avatar_url }` de `user_profiles`
- `role`: string de `get_user_role()` RPC
- `loading`: boolean (true mientras fetchea)

### Dónde se usa

- `Navbar.tsx:29` — para el botón de auth y link a mi-cuenta/admin
- Es el **único** lugar que usa este hook

## Roles

### Tabla `user_profiles`

```sql
role user_role ENUM: 'admin' | 'member'
```

**No** distingue entre registrado gratis y miembro pago. `role` solo se usa para permisos de admin.

### Determinación del nivel de membresía

En páginas con visibilidad (artistas, agenda, tienda, streaming):

```typescript
// Ejemplo de app/artistas/[slug]/page.tsx:141-149
const { data: profile } = await supabase
  .from('user_profiles')
  .select('membresia_activa, membresia_hasta')
  .eq('id', user.id)
  .single();

nivel = activa && (!hasta || new Date(hasta) > new Date()) ? 'miembro' : 'registrado';
```

## Relación con otros docs

- Flujo completo de login/registro/recovery — `paginas/auth.md`
- Auditoría de seguridad — `seguridad/auditoria-login.md`
- Sistema de visibilidad — `sistemas/visibilidad.md`
