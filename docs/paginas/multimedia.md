# Multimedia — `/multimedia`

**Archivos fuente:**
- Page: `app/multimedia/page.tsx:1-46`
- Client: `app/multimedia/MultimediaClient.tsx`
- Layout: `app/multimedia/layout.tsx` (incluye ParticleBackground)

## La idea

Página que combina dos tipos de contenido audiovisual:
1. **Multimedia pública** — videos de `multimedia_videos` (siempre visibles)
2. **Transmisiones pasadas** — videos de `streaming_contenido` donde `fue_transmitido = true` (solo visibles para usuarios logueados)

No usa el sistema de visibilidad de 3 niveles — la división es binaria: logueado / no logueado.

## Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Server Component (async) |
| Revalidación | `dynamic = 'force-dynamic'` |
| Cliente Supabase | `createSupabaseServer()` |

## Data fetching

```typescript
// app/multimedia/page.tsx:10-37 — 2 queries (la segunda condicional)

// Siempre
multimedia_videos:
  SELECT id, titulo, youtube_url, archivo_url, descripcion, tipo, orden
  WHERE active = true ORDER BY orden

// Solo si hay sesión
streaming_contenido:
  SELECT id, titulo, slug, youtube_video_id, thumbnail_url,
         tipo, duracion_minutos, transmitido_en
  WHERE fue_transmitido = true AND activo = true
  ORDER BY transmitido_en DESC
```

## Props pasadas al cliente

```typescript
// app/multimedia/page.tsx:40-44
<MultimediaClient
  items={items ?? []}              // multimedia_videos públicos
  transmisiones={transmisiones}    // streaming_contenido (solo si logueado)
  estaLogueado={!!user}            // boolean
/>
```

## DB involucrada

| Tabla | Condición | Auth |
|-------|-----------|------|
| `multimedia_videos` | `active = true` | Público |
| `streaming_contenido` | `fue_transmitido = true`, `activo = true` | Sesión |

La tabla `streaming_contenido` tiene una columna `fue_transmitido` (BOOLEAN). Es diferente de `visibilidad` — es un flag histórico que marca contenido que ya fue emitido en vivo.
