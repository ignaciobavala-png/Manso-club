# ISR y Revalidación

**Archivos fuente:**
- Revalidación principal: `app/api/revalidate/route.ts:1-44`
- Admin revalidation: `app/api/revalidate-admin/route.ts`
- Internal revalidation: `app/api/revalidate-internal/route.ts`
- Cron ping: `app/api/cron/ping/route.ts`

## Páginas con ISR

| Ruta | `revalidate` | Archivo |
|------|-------------|---------|
| `/` | 30s | `app/page.tsx:12` |
| `/about` | 60s | `app/about/page.tsx:8` |
| `/artistas` | 30s | `app/artistas/page.tsx:5` |
| `/manifiesto` | 60s | `app/manifiesto/page.tsx:5` |
| `/trabaja-con-nosotros` | 60s | `app/trabaja-con-nosotros/page.tsx:6` |

### Páginas con `force-dynamic`

| Ruta | Archivo |
|------|---------|
| `/artistas/[slug]` | `app/artistas/[slug]/page.tsx:11` |
| `/tienda` | `app/tienda/page.tsx:3` |
| `/streaming` | `app/streaming/page.tsx:5` |
| `/multimedia` | `app/multimedia/page.tsx:4` |

Sin cacheo del lado del servidor. Solo cache HTTP del CDN.

## `/api/revalidate` — Revalidación programática

### Auth

```typescript
// app/api/revalidate/route.ts:18-20
Authorization: Bearer ${CRON_SECRET}
```

Solo acepta requests con el header correcto.

### Mapa de tabla → rutas

```typescript
// app/api/revalidate/route.ts:5-15
const TABLE_PATHS: Record<string, string[]> = {
  artistas:        ['/artistas', '/artistas/[slug]', '/'],
  artistas_tracks: ['/artistas', '/artistas/[slug]'],
  artista_fotos:   ['/artistas', '/artistas/[slug]'],
  eventos:         ['/agenda', '/'],
  agenda:          ['/agenda', '/'],
  productos:       ['/tienda', '/'],
  gallery:         ['/'],
  about_us:        ['/about'],
  membresias:      ['/membresias', '/'],
};
```

### Uso

```bash
# Revalidar una tabla específica
POST /api/revalidate
Authorization: Bearer ${CRON_SECRET}
{ "table": "artistas" }

# Revalidar todo
POST /api/revalidate
Authorization: Bearer ${CRON_SECRET}
{}
```

La respuesta incluye los paths revalidados y timestamp.

## `/api/revalidate-admin` — Revalidación desde el admin

Usado por el dashboard admin después de guardar cambios. Sin documentación detallada de auth en el fuente — requiere verificación.

## `/api/cron/ping` — Keep-alive

```typescript
// app/api/cron/ping/route.ts
```

Endpoint para Vercel Cron. Hace un ping a Supabase para evitar cold starts. También requiere `CRON_SECRET`.

## ISG (Incremental Static Generation)

Solo en artistas:

```typescript
// app/artistas/[slug]/page.tsx:99-110
export async function generateStaticParams() {
  const artistas = await supabase.from('artistas').select('slug').eq('active', true);
  return artistas.map(a => ({ slug: a.slug }));
}
```

Pre-renderiza todas las páginas de artista en build time. Las nuevas se generan on-demand (ISR fallback).

## Relación con otros docs

- Endpoints de API — `sistemas/api.md`
