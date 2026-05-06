# Rama `design` — Documentación de cambios

> Fecha: Mayo 2026
> Rama base: `design`
> Estado: Desplegada en Vercel (preview)

---

## Resumen

Rediseño completo de la sección de eventos en el home, nuevas secciones en la página principal (Quiénes Somos, Sponsor Belt), ajustes visuales globales (fondos, tipografía, espaciado), y cinturón de sponsors. Todos los componentes se conectan a datos reales desde Supabase.

---

## Archivos modificados (10)

### 1. `app/page.tsx`
- **Qué cambió**: Se agregaron 2 nuevas secciones.
- **Orden actual del home**:
  1. Hero
  2. Gallery (Nuestro Espacio)
  3. AboutUsPreview (Sobre Manso — nuevo)
  4. Agenda/Eventos
  5. Membresías
  6. Por qué Manso (Nuestro ADN)
  7. SponsorBelt (nuevo)
- **Datos**: `AboutUsPreview` lee de tabla `about_us`. `SponsorBelt` usa imágenes de `public/marcas/`.

---

### 2. `app/api/revalidate-admin/route.ts`
- **Qué cambió**: Se agregó `eventos_home` al map `TABLE_PATHS` → revalida `'/'` cuando se modifica desde el dashboard.

---

### 3. `app/globals.css`
- **Qué cambió**: Se agregó `@keyframes marquee` y `--animate-marquee` (disponible para futuro uso). Se agregó `transition: background-color 0.6s ease` al `body` para el cambio de color de fondo al scrollear a eventos.

---

### 4. `components/Home/EventosHome.tsx`
- **Qué cambió**: Reescribo completo.
- **Sección AGENDA (acordeón)**:
  - **Fuente de datos**: `supabase.from('agenda').select('*').eq('activo', true).order('created_at', { ascending: true })`
  - Cada fila: categoría + título + botón INSCRIBIRME (si tiene `luma_url`) o nada. Botón `+` (ícono `Plus` de Lucide) con círculo.
  - Al expandir: descripción, frecuencia, duración, precio, cupos máximos.
  - Solo un acordeón abierto a la vez.
- **Sección EVENTOS (carrusel horizontal)**:
  - **Fuente de datos**: `supabase.from('eventos').select('*').eq('activo', true).order('fecha', { ascending: true })` (sin límite).
  - Cards `aspect-[3/4]` con imagen full-bleed, overlay hover, botón TICKETS → o SOLD OUT en esquina inferior derecha.
  - Sin texto sobre la imagen.
- **Color de fondo**: Al scrollear a la sección, `#page-root` y `#eventos-section` cambian a `#BC2915` (manso-terra) mediante `scroll` event listener que detecta cuando el `<h2 id="eventos-titulo">` entra en viewport.

---

### 5. `components/Home/Gallery.tsx`
- **Qué cambió**: Fondo cambió de blanco (`#FFFFFF`) con rejilla negra a negro (`#1D1D1B`) con rejilla cream. Título a `text-manso-cream`.

---

### 6. `components/Home/HeroCarousel.tsx` y `components/Home/HeroClient.tsx`
- **Qué cambió**: Se eliminó "Scroll para explorar" con flecha. Se aplicaron tokens `TYPE.*` del design system. Limpieza de imports no usados.

---

### 7. `components/Home/MembresiasHome.tsx`
- **Qué cambió**: Fondo cambió de blanco a negro (`#1D1D1B`) con rejilla cream. Títulos a `text-manso-cream`. Cards normales a `bg-zinc-100`. Body text agrandado de `TYPE.bodySmall` a `TYPE.body`. Botón "SELECCIONAR" en card destacada: hover ahora es blanco (`hover:bg-white hover:text-black`).

---

### 8. `components/Home/PorQueManso.tsx`
- **Qué cambió**: Rediseño completo.
- **Tipo**: Pasó de server component a client component (`'use client'`).
- **Layout**: Se eliminaron las cards con números decorativos. Ahora es texto centrado con imágenes placeholder inline.
- **Estructura del texto**:
  ```
  NUESTRO ADN [IMG]
  MUCHO MÁS [IMG] QUE UN CLUB.
  EL TALENTO [IMG] SIEMPRE ESTUVO,
  FALTABA [IMG] UN LUGAR.
  ```
- **Animación**: Cada línea usa `AnimatedLine` con `useScroll` + `useTransform` + `clipPath` para efecto de revelado individual al scrollear.
- **Imágenes placeholder**: Server component `RandomGalleryPlaceholders` que lee desde `gallery_images` (shuffle, selecciona 4 aleatorias).
- **Contenido**: 4 bloques (Comunidad, Tercer Lugar, Espacio Híbrido, Oportunidades) como cards en grid 2 columnas con hover effect.
- **Eliminado**: Botón "CONOCENOS".
- **Datos**: Texto fijo hardcodeado (ya no desde `contenido` DB).

---

### 9. `components/Home/SponsorBelt.tsx`
- **Qué cambió**: Nuevo componente.
- **Layout**: Grid 4 columnas, logos centrados, fondo negro puro (`#000000`).
- **Logos**: `brightness-0 invert` para que se vean blancos sobre negro. Opacidad completa (`opacity-100`).
- **Altura**: `h-[200%]` del contenedor para duplicar tamaño sin aumentar el padding.

---

## Archivos nuevos (4)

| Archivo | Tipo | Propósito |
|---|---|---|
| `components/Home/AboutUsPreview.tsx` | Server | Obtiene `subtitle` + `description` de tabla `about_us` vía `getAboutUs()`, pasa al client. |
| `components/Home/AboutUsPreviewClient.tsx` | Client | Renderiza "SOBRE MANSO" con efecto ascensor (texto sube desde abajo de una línea). Párrafos animados con Framer Motion staggered. |
| `components/Home/RandomGalleryPlaceholders.tsx` | Server | Lee `gallery_images`, shuffle, selecciona 4 aleatorias, renderiza `<Image>` inline. |
| `components/Home/SponsorBelt.tsx` | Client | Grid 4 columnas con logos de sponsors. |

---

## Assets

### `/public/marcas/` (4 logos)

| Archivo | Marca |
|---|---|
| `gin.png` | Herederos Gin |
| `settle_transparent_clean.png` | Settle |
| `takenos_transparent_clean(1).png` | Takenos |
| `warsteiner_transparent.png` | Warsteiner |

---

## Dependencias de datos (tablas Supabase)

| Componente | Tabla | Columnas usadas |
|---|---|---|
| `EventosHome` (AGENDA) | `agenda` | titulo, descripcion, categoria, duracion, frecuencia, precio, cupos_maximos, luma_url, activo, orden |
| `EventosHome` (EVENTOS) | `eventos` | titulo, fecha, categoria, disponible, activo, imagen_url, link_tickets |
| `AboutUsPreview` | `about_us` | subtitle, description |
| `RandomGalleryPlaceholders` | `gallery_images` | photo_url, active |
| `MembresiasHome` | `membresias` | nombre, precio, periodo, categoria, destacado, activo, orden |
| `MembresiasHome` | `membresia_beneficios` | texto, incluido, orden |

---

## Dashboard admin — tablas editables

| Tab del dashboard | Tabla Supabase | Componente afectado |
|---|---|---|
| agenda | `agenda` | EventosHome (acordeón) |
| eventos | `eventos` | EventosHome (carrusel) |
| about | `about_us` | AboutUsPreview |
| galeria | `gallery_images` | Gallery, RandomGalleryPlaceholders |
| membresias | `membresias` | MembresiasHome |

---

## Notas para el futuro

1. **Sponsors**: Los logos están hardcodeados en `SponsorBelt.tsx`. Si se agregan más marcas, editar el array `LOGOS` y ajustar `grid-cols-4` según cantidad.
2. **NUESTRO ADN**: El texto ya no es editable desde dashboard. Si se necesita que sea editable, reconectar a `contenido` o crear una nueva tabla.
3. **EventosHome (carrusel)**: Las cards no tienen texto sobre la imagen. Si se necesita agregar, modificar el bloque "Esquina inferior — solo botón".
4. **ParticleBackground**: Se mantiene en PorQueManso. Verificar compatibilidad si el fondo cambia.
5. **Color de fondo al scrollear**: El trigger del cambio a `#BC2915` es el `<h2 id="eventos-titulo">`. Si se mueve o renombra ese elemento, actualizar el scroll listener.
6. **`animate-marquee`**: Definido en `globals.css` pero no se usa actualmente (el SponsorBelt es estático). Disponible para futuros carruseles.
