# Artistas — `/artistas` y `/artistas/[slug]`

**Archivos fuente:**
- Listing: `app/artistas/page.tsx:1-50`, `app/artistas/ArtistasClient.tsx`
- Perfil: `app/artistas/[slug]/page.tsx:1-341`, `app/artistas/[slug]/ArtistProfilePlayer.tsx`
- Track manager: `components/artistas/ArtistTrackManager.tsx`

## La idea

Dos páginas que forman una unidad:

1. **`/artistas`** — grilla de todos los artistas activos, agrupados por tipo (DJ, Artista Visual, etc.). Pública, sin login requerido.
2. **`/artistas/[slug]`** — perfil individual del artista. Se expande con contenido según el nivel del usuario que mira.

Una URL, dos o tres experiencias según autenticación:

```
/artistas/ana
├── Todos ven: bio, foto, estilo, links, SoundCloud player público
├── Registrados ven además: tracks con visibilidad 'registrado'
└── Miembros ven además: tracks con visibilidad 'miembro'
```

## `/artistas` — Listing

**Archivo:** `app/artistas/page.tsx:1-50`

| Detalle | Valor |
|---------|-------|
| Tipo | Server Component |
| ISR | `revalidate = 30` |
| Cliente Supabase | `createSupabaseAnon()` (sin auth) |

### Data fetching

```typescript
// app/artistas/page.tsx:22-26
artistas: SELECT id, nombre, slug, bio, estilo, imagen_url,
                 soundcloud_url, social_links, active, tipo, user_id
          FROM artistas WHERE active = true ORDER BY nombre

// Solo si hay artistas visuales — app/artistas/page.tsx:32-43
artista_fotos: SELECT id, url, artista_id, orden
               FROM artista_fotos
               WHERE artista_id IN (visualIds)
               ORDER BY orden
```

Los artistas visuales (`tipo === 'Artista Visual'`) muestran sus obras (fotos) además de su perfil. Las fotos se cruzan con el slug del artista para navegar a su perfil.

### Componentes

| Componente | Rol |
|-----------|-----|
| `ArtistasClient` (`app/artistas/ArtistasClient.tsx`) | Client component que renderiza la grilla con hover effects, agrupación por tipo, y navegación al perfil |
| Server component padre | Solo fetchea datos y los pasa como props |

## `/artistas/[slug]` — Perfil

**Archivo:** `app/artistas/[slug]/page.tsx:1-341`

| Detalle | Valor |
|---------|-------|
| Tipo | Server Component (async) |
| Revalidación | `dynamic = 'force-dynamic'` |
| ISG | `generateStaticParams` pre-renderiza todos los slugs activos |
| Cliente Supabase | Mixto: `createSupabaseAnon()` para datos públicos, `createSupabaseServer()` para sesión |

### Sistema de visibilidad (3 niveles)

El perfil de artista fue el primer lugar donde se implementó el sistema de visibilidad. El patrón se replica en agenda, tienda y streaming.

```typescript
// app/artistas/[slug]/page.tsx:26-32
type Nivel = 'publico' | 'registrado' | 'miembro';

const NIVELES_VISIBLES: Record<Nivel, string[]> = {
  publico:    ['publico'],
  registrado: ['publico', 'registrado'],
  miembro:    ['publico', 'registrado', 'miembro'],
};
```

**Determinación del nivel** (`app/artistas/[slug]/page.tsx:136-150`):

1. `supabaseServer.auth.getUser()` — ¿hay sesión?
2. Si no hay: `nivel = 'publico'`
3. Si hay: consulta `user_profiles.membresia_activa` y `membresia_hasta`
4. Si `membresia_activa === true` y (`membresia_hasta` es null o es fecha futura): `nivel = 'miembro'`
5. Si no: `nivel = 'registrado'`

### Data fetching

```typescript
// app/artistas/[slug]/page.tsx:51-97 — 3 queries, 2 con filtro de visibilidad

getArtista(slug):
  SELECT * FROM artistas WHERE slug = ? AND active = true

getArtistaFotos(artistaId):
  SELECT id, url, orden FROM artista_fotos
  WHERE artista_id = ? ORDER BY orden

getArtistTracks(artistaId, nivelesVisibles):
  SELECT id, titulo, soundcloud_url, orden FROM artistas_tracks
  WHERE artista_id = ? AND activo = true
    AND visibilidad IN (nivelesVisibles)
  ORDER BY orden

getHiddenTracksExist(artistaId, nivelesVisibles):
  SELECT visibilidad FROM artistas_tracks
  WHERE artista_id = ? AND activo = true
  → busca si hay tracks con visibilidad fuera del nivel del usuario
```

Las 4 queries se ejecutan en paralelo (`Promise.all`, línea 157-161). `getHiddenTracksExist` solo se ejecuta si `nivel !== 'miembro'`.

### Secciones del perfil

| Sección | Líneas | Condición |
|---------|--------|-----------|
| `ArtistTrackManager` | 180 | Siempre — sincroniza el reproductor global con el track del artista |
| Back button | 183-191 | Siempre |
| Profile header (foto + info) | 194-287 | Siempre |
| Links sociales | 216-242 | Si hay `social_links` o `soundcloud_url` |
| SoundCloud Player | 244-258 | Si `artista.soundcloud_url` existe |
| Gate de contenido oculto | 291-327 | Si `hayTracksOcultos === true` |
| Mosaico de obras | 330-337 | Si `fotos.length > 0` |

### Gate de contenido oculto

Cuando hay tracks que el usuario no puede ver, se muestra un banner con CTA:

- **Público →** "Hay más tracks de {artista} para miembros registrados" + botón "Registrarse" → `/login`
- **Registrado →** "Hay tracks exclusivos de {artista} para miembros" + botón "Ver membresías" → `/membresias`

El banner usa colores diferentes según nivel: azul (`manso-blue`) para público, terra (`manso-terra`) para registrado. `app/artistas/[slug]/page.tsx:291-327`.

### Social links — doble formato

El campo `social_links` en la tabla `artistas` soporta dos formatos:

```typescript
// Formato nuevo (array)
social_links: [{ label: 'Instagram', url: 'https://...' }, ...]

// Formato viejo (objeto) — legacy
social_links: { instagram: '@usuario', spotify: 'https://...' }
```

La normalización se hace en `app/artistas/[slug]/page.tsx:167-175`:
- Si es array → se usa directo
- Si es objeto → se convierte a array con label + URL construida

### ArtistProfilePlayer

**Archivo:** `app/artistas/[slug]/ArtistProfilePlayer.tsx`

Componente client-side que renderiza un reproductor SoundCloud inline con:
- Lista de tracks clickeables
- Sincronización con el reproductor global vía `ArtistTrackManager`

### ArtistTrackManager

**Archivo:** `components/artistas/ArtistTrackManager.tsx`

Componente sin UI que al montarse dispara eventos custom para que el `GlobalMusicPlayer` reproduzca el SoundCloud del artista:

- `globalPlayer:artistOverride` → al montar (con artistName + soundcloud_url)
- `globalPlayer:clearOverride` → al desmontar (vuelve al track de `main_music`)

Esto permite que al entrar a un perfil de artista, el reproductor global del sitio cambie automáticamente al SoundCloud de ese artista, y al salir vuelva a la música general.

### GalleryGrid en el perfil

Si el artista tiene fotos en `artista_fotos`, se renderiza un mosaico con `GalleryGrid` (mismo componente usado en la home). Las fotos son públicas — no pasan por el filtro de visibilidad.

### SEO y metadata

`generateMetadata` (`app/artistas/[slug]/page.tsx:112-130`):
- Title: `{artista.nombre} | Manso Club`
- Description: bio del artista o `{nombre} — {estilo} en Manso Club`
- OpenGraph: type `profile`, imagen del artista si existe

`generateStaticParams` (`app/artistas/[slug]/page.tsx:99-110`):
- Pre-renderiza todos los slugs de artistas activos para ISG
- Ordenados por nombre alfabético

## DB involucrada

| Tabla | Operación | Filtro | Auth |
|-------|-----------|--------|------|
| `artistas` | SELECT | `active = true` | Público |
| `artista_fotos` | SELECT | `artista_id` | Público |
| `artistas_tracks` | SELECT | `artista_id`, `activo = true`, `visibilidad IN (...)` | Público |
| `user_profiles` | SELECT | `id = auth.uid()` | Sesión |

La tabla `artistas_tracks` tiene una columna `visibilidad` (TEXT, valores: `'publico'`, `'registrado'`, `'miembro'`) que controla qué tracks ve cada nivel.

## Relación con otros docs

- El sistema de visibilidad completo en `sistemas/visibilidad.md` (pendiente)
- El reproductor global en `sistemas/reproductor-global.md` (pendiente)
- La planificación de extensión privada de artistas en `comunidad/artistas-extension-privada.md`
- La arquitectura de niveles de acceso en `comunidad/niveles-de-acceso.md`
