# Home — `/`

**Archivo fuente:** `app/page.tsx:1-78`

## La idea

Landing page principal del sitio. Es una página de scroll vertical con 8 secciones independientes que se renderizan en un solo server component. Cada sección fetchea sus propios datos internamente (no desde el page.tsx).

## Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Server Component |
| ISR | `revalidate = 30` |
| Cliente Supabase | No usa — cada sección fetchea por su cuenta |

## Secciones (en orden de renderizado)

### 1. Hero — `components/Home/Hero.tsx` + `HeroClient.tsx` + `HeroCarousel.tsx`

| Detalle | Valor |
|---------|-------|
| Tipo | Server wrapper → Client component |
| Datos | `hero_slides` de Supabase, diferenciados por dispositivo (desktop/mobile) |
| Media | Soporta video e imagen. Usa `getMediaUrlForDevice()` y `getHeroSlidesByDevice()` de `lib/hero.ts` |
| UI | Carrusel fullscreen con autoplay, dot indicators, swipe, CTA buttons |

### 2. Gallery — `components/Home/Gallery.tsx` + `GalleryGrid.tsx`

| Detalle | Valor |
|---------|-------|
| Tipo | Server wrapper → Client component |
| Datos | `gallery` de Supabase, fallback a 6 imágenes estáticas |
| UI | Masonry grid responsive de imágenes |

### 3. AboutUsPreview — `components/Home/AboutUsPreview.tsx` + `AboutUsPreviewClient.tsx`

| Detalle | Valor |
|---------|-------|
| Tipo | Server wrapper → Client component |
| Datos | `about_us` de Supabase |
| UI | Subtítulo + párrafos de descripción + foto principal |

### 4. EventosHome — `components/Home/EventosHome.tsx`

| Detalle | Valor |
|---------|-------|
| Tipo | Client component |
| Datos | `agenda` (accordion semanal) + `eventos` (flyers horizontales) |
| UI | Acordeón de actividades agrupadas + carrusel horizontal de flyers con badges TICKETS/SOLD OUT |

### 5. MembresiasHome — `components/Home/MembresiasHome.tsx`

| Detalle | Valor |
|---------|-------|
| Tipo | Client component |
| Datos | `membresias` de Supabase agrupadas por categoría |
| UI | Cards de membresías agrupadas por categoría ("Cowork", "Socios & Residentes") + toggle ARS/USD |

### 6. PorQueManso — `components/Home/PorQueManso.tsx`

| Detalle | Valor |
|---------|-------|
| Tipo | Client component |
| Datos | Ninguno — contenido estático |
| UI | Líneas animadas de manifiesto + 4 cards de filosofía con reveal al scroll |
| Hijo | Recibe `<RandomGalleryPlaceholders count={4} />` como children para decoración |
| Exclusión | `data-cursor-hidden` — el cursor trail se desactiva en esta sección |

### 7. Newsletter — `components/Home/Newsletter.tsx`

| Detalle | Valor |
|---------|-------|
| Tipo | Client component |
| Acción | POST a `/api/newsletter` — inserta email en `newsletter_suscriptores` |
| Dedup | Error code `23505` (unique violation) se traga silenciosamente |

### 8. SponsorBelt — `components/Home/SponsorBelt.tsx`

| Detalle | Valor |
|---------|-------|
| Tipo | Client component |
| Datos | Ninguno — grid estático de 4 logos |
| Marcas | Gin, Settle, Takenos, Warsteiner |
| UI | Grid blanco sobre negro |

## Metadata

```typescript
// app/page.tsx:14-32
title: 'Manso Club | Cowork Creativo & Talleres en Buenos Aires'
description: 'Ideal para freelancers, emprendedores, startups...'
openGraph: image /og-image.png (800x800)
twitter: summary_large_image
```

## DB involucrada (indirectamente, vía componentes)

| Tabla | Sección | Cliente |
|-------|---------|---------|
| `hero_slides` | Hero | Anónimo (sin auth) |
| `gallery` | Gallery | Anónimo |
| `about_us` | AboutUsPreview | Anónimo |
| `agenda` | EventosHome | Anónimo |
| `eventos` | EventosHome | Anónimo |
| `membresias` | MembresiasHome | Anónimo |
| `newsletter_suscriptores` | Newsletter | Service role (POST) |

## Relación con otros docs

- Los componentes individuales están documentados en sus respectivos archivos de página
- El reproductor global corre en toda la home — `sistemas/reproductor-global.md`
- La navegación — `sistemas/navegacion.md`
