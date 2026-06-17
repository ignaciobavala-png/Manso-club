# Mi Cuenta — `/mi-cuenta`

**Archivos fuente:**
- Page: `app/mi-cuenta/page.tsx:1-104`
- Tabs: `app/mi-cuenta/MiCuentaTabs.tsx`
- Actions: `app/mi-cuenta/actions.ts`

## La idea

Dashboard personal del usuario autenticado. Muestra su perfil, membresía activa, contenido de streaming, tickets comprados y — si es artista — acceso a su perfil de artista. Interfaz con tabs.

## Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Server Component (async) |
| Auth | Requerido — `!user → redirect('/login')` |
| Cliente Supabase | `createSupabaseServer()` |

## Data fetching

5 queries en paralelo con `Promise.all`:

```typescript
// app/mi-cuenta/page.tsx:14-56

1. user_profiles:
   SELECT display_name, email, telefono, avatar_url, id, membresia_activa
   WHERE id = user.id

2. user_membresias_activas:
   SELECT vencimiento, membresias(nombre, precio, periodo,
          incluye_streaming, membresia_beneficios(texto, incluido, orden))
   WHERE user_id = user.id AND estado = 'activa'
     AND vencimiento > now()
   ORDER BY vencimiento DESC LIMIT 1

3. streaming_contenido:
   SELECT id, titulo, slug, tipo, thumbnail_url
   WHERE activo = true ORDER BY orden LIMIT 3

4. tickets:
   SELECT id, codigo, evento_nombre, tipo, usado, created_at
   WHERE email = user.email ORDER BY created_at DESC LIMIT 10

5. artistas:
   SELECT id, nombre, slug, bio, estilo, tipo, imagen_url,
          soundcloud_url, social_links
   WHERE user_id = user.id → maybeSingle()
```

### Procesamiento de membresía

```typescript
// app/mi-cuenta/page.tsx:59-78
```

La membresía viene anidada (`membresiaRaw.membresias`). Se extraen: `nombre`, `precio`, `periodo`, `incluye_streaming`, `vencimiento`, `beneficios` (ordenados por `orden`).

## Props pasadas a MiCuentaTabs

```typescript
// app/mi-cuenta/page.tsx:88-100
<MiCuentaTabs
  userId={user.id}
  displayName={displayName}           // profile.display_name || email sin @ || 'Usuario'
  email={profile.email ?? user.email}
  telefono={profile.telefono ?? null}
  avatarUrl={profile.avatar_url ?? null}
  membresia={membresia}               // null si no tiene
  streaming={streamingRaw ?? []}      // 3 items
  tickets={ticketsRaw ?? []}          // 10 más recientes
  tieneMembresia={tieneMembresia}     // membresia?.incluye_streaming
  esMiembro={esMiembro}               // profile?.membresia_activa
  artista={artistaRaw ?? null}        // artista vinculado (si es artista)
/>
```

## Tabs (en MiCuentaTabs)

| Tab | Contenido |
|-----|-----------|
| Perfil | Datos personales (display_name, email, teléfono, avatar) — editable vía server action |
| Membresía | Plan activo con beneficios, fecha de vencimiento, o CTA para asociarse |
| Streaming | 3 videos de streaming (acceso rápido) |
| Tickets | Últimos 10 tickets con código, evento, fecha, estado |
| Artista | Solo si el usuario está vinculado a un artista — link a su perfil |

## DB involucrada

| Tabla | Operación |
|-------|-----------|
| `user_profiles` | SELECT |
| `user_membresias_activas` | SELECT (con join a `membresias` y `membresia_beneficios`) |
| `membresias` | SELECT (anidado) |
| `membresia_beneficios` | SELECT (anidado) |
| `streaming_contenido` | SELECT (LIMIT 3) |
| `tickets` | SELECT (WHERE email, LIMIT 10) |
| `artistas` | SELECT (WHERE user_id, maybeSingle) |

## Relación con otros docs

- La autenticación — `sistemas/autenticacion.md`
- El middleware protege esta ruta — `middleware.ts:76-78`
