# Tienda — `/tienda` y `/producto/[id]`

**Archivos fuente:**
- Listing: `app/tienda/page.tsx:1-121`
- Detalle: `app/producto/[id]/page.tsx:1-418`
- Componentes: `components/shop/ProductCard.tsx`, `components/ui/CurrencyToggle.tsx`

## `/tienda` — Listado de productos

### Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Server Component (async) |
| Revalidación | `dynamic = 'force-dynamic'` |
| Cliente Supabase | `createSupabaseServer()` (sesión) + `createSupabaseAnon()` (datos) |

### Sistema de visibilidad

Mismo patrón de 3 niveles:

```typescript
// app/tienda/page.tsx:28-34
type Nivel = 'publico' | 'registrado' | 'miembro';
const NIVELES_VISIBLES: Record<Nivel, string[]> = { ... };
```

### Data fetching

```typescript
// app/tienda/page.tsx:58-67 — 2 queries en Promise.all

productos:
  SELECT * FROM productos
  WHERE visibilidad IN (nivelesVisibles)
  ORDER BY created_at DESC

todasVisibilidades (solo si nivel !== 'miembro'):
  SELECT visibilidad FROM productos
  → para determinar si hay productos ocultos
```

### UI

- `AdaptiveSectionLayout` con título "Tienda" y subtítulo "objetos curados / emprendedores locales"
- `CurrencyToggle` para ARS/USD
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Cada producto usa `ProductCard` component
- Gate de contenido oculto (mismo patrón que agenda y artistas)

## `/producto/[id]` — Detalle de producto

### Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Client component (`'use client'`) |
| Revalidación | Client-side fetch on mount (`useEffect` + `useParams`) |
| Cliente Supabase | Browser client |

### Comportamiento especial

**Oculta el navbar global** con CSS inyectado:

```typescript
// app/producto/[id]/page.tsx:172-176
<style jsx global>{`
  nav.fixed { display: none !important; }
`}</style>
```

Renderiza su propia barra de navegación con "Volver" y "Ver tienda".

### Data fetching

```typescript
// app/producto/[id]/page.tsx:36-50
SELECT * FROM productos WHERE id = ? AND active = true
```

### UI

Layout: `grid lg:grid-cols-2` con `items-center` para centrado vertical.

**Columna izquierda — Galería:**
- Imagen principal con navegación prev/next (botones ‹ ›)
- Dot indicators para imágenes múltiples
- Thumbnails horizontales debajo de la imagen principal
- Fallback a `/manso.png` si la imagen no carga (`onError`)

**Columna derecha — Info:**
- Nombre del producto
- Precio + "+ envío"
- Indicador de stock: punto verde (con stock) o rojo (sin stock)
- Selector de cantidad con botones +/- (limitado por `producto.stock`)
- Descripción resumida (`line-clamp-2`)
- Trust signals: envío todo país, pago seguro, 30 días devolución

### Acciones

**"Agregar al carrito"** (`app/producto/[id]/page.tsx:73-115`):
1. Si `stock === 0`: redirige a `/checkout` (caso borde)
2. Agrega el producto `cantidad` veces al carrito vía `useCart.addItem()`
3. Muestra toast verde en pantalla por 3 segundos
4. Redirige a `/tienda` después de 800ms

**"Comprar ahora"** (`app/producto/[id]/page.tsx:117-137`):
1. Si `stock === 0`: redirige a `/checkout`
2. Agrega el producto `cantidad` veces al carrito
3. Redirige inmediatamente a `/checkout`

### Estados

| Estado | UI |
|--------|-----|
| Loading | Spinner + "Cargando producto..." |
| No encontrado | "Producto no encontrado" + link a tienda |
| Normal | Layout completo |
| Sin stock | Botones cambian a "Consultar" (verde y rojo) |

### Edge cases

| Caso | Comportamiento |
|------|---------------|
| `producto.imagenes_urls` vacío o undefined | Fallback a `/manso.png` |
| `producto.descripcion` vacío | Texto por defecto: "Edición limitada Manso_Club..." |
| Imagen no carga (404) | `onError` → reemplaza src con `/manso.png` |
| Una sola imagen | No muestra navegación ni thumbnails |
| Cantidad supera stock | Botón + se deshabilita al llegar al máximo |

## DB involucrada

| Tabla | Ruta | Filtro |
|-------|------|--------|
| `productos` | `/tienda` | `visibilidad IN (...)` |
| `productos` | `/producto/[id]` | `id = ?`, `active = true` |
| `user_profiles` | `/tienda` | `id = auth.uid()` (para nivel) |

## Relación con otros docs

- El carrito (`useCart`) — `sistemas/carrito.md`
- El checkout — `paginas/checkout.md`
