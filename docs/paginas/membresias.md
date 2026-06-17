# Membresías — `/membresias` y `/membresias/pagar`

**Archivos fuente:**
- Listing: `app/membresias/page.tsx:1-259`
- Pago: `app/membresias/pagar/page.tsx:1-108` (similar a `agenda/pagar`)
- Tipos: `lib/types/membresia.ts`
- Store: `store/useCurrency.ts`

## `/membresias` — Listado de planes

### Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Client component (`'use client'`) |
| Revalidación | Client-side fetch on mount (`useEffect`) |
| Cliente Supabase | Browser client |
| Auth | No requiere — página pública |

### Data fetching

```typescript
// app/membresias/page.tsx:21-64 — 3 queries secuenciales

membresias:
  SELECT *, membresia_beneficios(id, texto, incluido)
  FROM membresias WHERE activo = true ORDER BY orden

membresias_config:
  SELECT texto_intro FROM membresias_config (single row)

membresias_gallery:
  SELECT id, photo_url FROM membresias_gallery
  WHERE active = true ORDER BY order_index
```

### Estados

| Estado | UI |
|--------|-----|
| Loading | Spinner centrado |
| Sin membresías | Icono Crown + "Próximamente disponibles" |
| Con datos | Cards agrupadas por categoría |
| `textoIntro` vacío | Placeholder de 3 bloques de líneas skeleton |
| `textoIntro` con texto | Párrafos separados por `\n\n+` |

### Agrupación por categoría

Las membresías se agrupan por `categoria`. El orden es fijo:

```typescript
// app/membresias/page.tsx:116-117
const ORDEN_CATEGORIAS = ['Cowork', 'Socios & Residentes'];
```

Las categorías que no están en el array se agregan al final.

### UI de cada card

- Ancho máximo: `max-w-[360px]`, centradas con `flex-wrap justify-center`
- Card destacada (`membresia.destacado === true`): fondo negro, badge "Más Popular" con estrella
- Card normal: fondo `bg-zinc-100`, borde `border-zinc-200`
- Nombre del plan + precio centrado
- Toggle ARS/USD desde `useCurrency()`: convierte `membresia.precio * rate` si hay rate
- Lista de beneficios con ✓ (incluido, verde) y ✗ (no incluido, rojo/tachado)
- Descripción opcional debajo de los beneficios
- Botón "SELECCIONAR" → `/membresias/pagar?nombre=&precio=&periodo=`

### Galería final

Si `membresias_gallery` tiene imágenes, se muestra un mosaico al final:

```typescript
// app/membresias/page.tsx:239-249
grid grid-cols-2 md:grid-cols-3
aspect-[4/3], rounded-2xl
hover:scale-[1.02]
```

## `/membresias/pagar` — Pago de membresía

### Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Server Component (async) |
| Cliente Supabase | `getBankConfig()` de `lib/getBankConfig.ts` |
| SEO | `robots: { index: false }` |

Estructura casi idéntica a `/agenda/pagar`. Mismos datos bancarios, mismo `CopyButton`, mismo botón WhatsApp. Diferencias:

- Back link a `/membresias` en vez de `/agenda`
- Muestra periodo (`membresia.periodo`) además del nombre y precio
- Mensaje de WhatsApp: "Me quiero asociar a Manso Club. Plan: {nombre} — {periodo} (${precio}). Adjunto comprobante."

### CopyButton

Componente compartido: `app/membresias/pagar/CopyButton.tsx`. Usa `navigator.clipboard.writeText()`.

## DB involucrada

| Tabla | Ruta | Operación |
|-------|------|-----------|
| `membresias` | `/membresias` | SELECT (con join a `membresia_beneficios`) |
| `membresia_beneficios` | `/membresias` | SELECT (anidado en membresias) |
| `membresias_config` | `/membresias` | SELECT (texto_intro) |
| `membresias_gallery` | `/membresias` | SELECT (photo_url) |
| `checkout_config` | `/membresias/pagar` | SELECT (config bancaria) |

## Relación con otros docs

- El toggle de moneda (`useCurrency`) usa `store/useCurrency.ts` y `/api/dolar`
- El patrón de pago se repite en `agenda.md` y `checkout.md`
