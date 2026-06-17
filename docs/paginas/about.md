# About Us — `/about`

**Archivo fuente:** `app/about/page.tsx:1-145`
**Libs:** `lib/team.ts`, `lib/aboutUs.ts`

## La idea

Página estática con información institucional: descripción del espacio, fotos y equipo. Contenido administrable desde el dashboard admin (tab "About Us").

## Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Server Component (async) |
| ISR | `revalidate = 60` |
| Cliente Supabase | Indirecto — usa `getTeamMembers()` y `getAboutUs()` |

## Data fetching

```typescript
// app/about/page.tsx:26-28
const teamMembers = await getTeamMembers();    // lib/team.ts → SELECT team WHERE active = true
const aboutUs = await getAboutUs();            // lib/aboutUs.ts → SELECT about_us (single row)
```

## Secciones

### 1. Texto principal + foto

Layout responsive: `flex-col lg:flex-row`. Texto a la izquierda (`w-full lg:w-1/2`), foto a la derecha.

```typescript
// app/about/page.tsx:46-50
aboutUs.description.split('\n').filter(p => p.trim()).map(...)
```

La descripción (campo `about_us.description`) se separa por saltos de línea. Cada párrafo se renderiza en un `<p>` con `text-lg md:text-xl`.

La foto principal (`about_us.main_photo_url`) usa `next/image` con `fill`, `priority`, `aspect-[4/3]` y `quality={95}`.

### 2. Galería de fotos

```typescript
// app/about/page.tsx:76-90
aboutUs.gallery_photos && aboutUs.gallery_photos.length > 0
```

Array de URLs de fotos. Layout: `flex-col sm:flex-row` con `aspect-[4/3]`, 2 fotos por fila en desktop.

### 3. Team

```typescript
// app/about/page.tsx:92-139
teamMembers de lib/team.ts
```

Grid de `grid-cols-2 md:grid-cols-4`. Cada miembro muestra:
- Foto (`member.photo_url`) con fallback a iniciales (`member.name` → 2 primeras letras)
- Nombre (`member.name`)
- Rol (`member.role`)

Si no hay miembros (array vacío), muestra 4 placeholders con iniciales fijas: AH, AM, FB, JP.

## Metadata

```typescript
// app/about/page.tsx:10-24
title: 'Nosotros | Manso Club'
description: 'Conocé el espacio creativo Manso Club en Buenos Aires...'
openGraph: image /og-image.png
```

## Layout visual

- Fondo: `bg-manso-black` con grid de líneas (`backgroundImage` con gradientes lineales, `48px` spacing)
- `ParticleBackground` overlay
- Envuelto en `AdaptiveSectionLayout` con `forceDark`

## DB involucrada

| Tabla | Campo | Operación |
|-------|-------|-----------|
| `about_us` | `subtitle`, `description`, `main_photo_url`, `gallery_photos` | SELECT |
| `team` | `name`, `role`, `photo_url` | SELECT (WHERE active = true) |
