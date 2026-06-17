# Streaming — `/streaming` y `/streaming/[slug]`

**Archivos fuente:**
- Biblioteca: `app/streaming/page.tsx:1-93`
- Player: `app/streaming/[slug]/page.tsx:1-156`
- Componente cliente: `app/streaming/StreamingLibrary.tsx`

## `/streaming` — Biblioteca de videos

### Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Server Component (async) |
| Revalidación | `dynamic = 'force-dynamic'` |
| Cliente Supabase | `createSupabaseServer()` (sesión) |

### Sistema de visibilidad

Mismo patrón de 3 niveles:

```typescript
// app/streaming/page.tsx:11-16
type Nivel = 'publico' | 'registrado' | 'miembro';
const NIVELES_VISIBLES: Record<Nivel, string[]> = { ... };
```

### Data fetching

```typescript
// app/streaming/page.tsx:43-57 — 3 queries en Promise.all

streaming_contenido:
  SELECT id, titulo, slug, descripcion, tipo, thumbnail_url,
         is_live, scheduled_at, duracion_minutos, curso_id, orden, visibilidad
  WHERE activo = true AND visibilidad IN (nivelesVisibles)
  ORDER BY orden

streaming_categorias:
  SELECT slug, nombre, color ORDER BY orden

streaming_config:
  SELECT modo, stream_url, contenido_id (single row)
```

### Canal en vivo

El sistema soporta 3 modos definidos en `streaming_config.modo`:

| Modo | Comportamiento |
|------|---------------|
| `apagado` | No hay canal en vivo |
| `grabado` | Muestra un contenido específico (`contenido_id`) como "canal" |
| `en_vivo` | Muestra stream URL externa |

Si el modo es `grabado`, se hace un cuarto fetch:

```typescript
// app/streaming/page.tsx:62-68
SELECT id, titulo, youtube_video_id, thumbnail_url
FROM streaming_contenido WHERE id = canalConfig.contenido_id
```

### UI

- Fondo `bg-manso-black` con grid de líneas (`48px`)
- `ParticleBackground` overlay
- Delega todo el renderizado a `StreamingLibrary` (client component)
- Props que recibe: `contenido`, `categorias`, `nivel`, `canal` ({ modo, streamUrl, contenido })

## `/streaming/[slug]` — Reproductor de video

### Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Server Component (async) |
| Auth | Requerido — `!user → redirect(/login?from=/streaming/SLUG)` |
| Cliente Supabase | `createSupabaseServer()` |

### Data fetching

```typescript
// app/streaming/[slug]/page.tsx:33-38
SELECT * FROM streaming_contenido WHERE slug = ? AND activo = true
```

Si no encuentra → `notFound()`.

### Paywall

Actualmente el paywall está **desactivado**:

```typescript
// app/streaming/[slug]/page.tsx:42
const tieneAcceso = true;  // ← hardcodeado
```

El código tiene la lógica de paywall completa (líneas 109-139) pero nunca se ejecuta porque `tieneAcceso` siempre es `true`. Cuando se active, mostrará:
- Thumbnail difuminado con overlay oscuro
- Candado + "Contenido exclusivo"
- "Este contenido está disponible con una membresía activa"
- Botón "Ver membresías" → `/membresias`

### Player

```typescript
// app/streaming/[slug]/page.tsx:7-19 — extractYouTubeId()
```

Soporta 4 formatos de URL de YouTube:
- `youtube.com/live/ID`
- `youtu.be/ID`
- `youtube.com/watch?v=ID`
- `youtube.com/embed/ID`

El iframe se renderiza con `?rel=0&modestbranding=1`.

Si `contenido.youtube_video_id` está vacío → placeholder "Video próximamente disponible".

### UI

- Badges: categoría (con color de `streaming_categorias`) + "En vivo" (si `is_live`)
- Título del video
- Duración (si `duracion_minutos`)
- Player YouTube en `aspect-video` con bordes redondeados
- Descripción debajo del player

## DB involucrada

| Tabla | Ruta | Operación |
|-------|------|-----------|
| `streaming_contenido` | `/streaming` | SELECT (filtrado por visibilidad) |
| `streaming_contenido` | `/streaming/[slug]` | SELECT (por slug) |
| `streaming_categorias` | Ambas | SELECT |
| `streaming_config` | `/streaming` | SELECT (canal) |
| `user_profiles` | `/streaming` | SELECT (nivel) |

## Relación con otros docs

- El sistema de visibilidad — `sistemas/visibilidad.md`
- La autenticación requerida en el player — `sistemas/autenticacion.md`
