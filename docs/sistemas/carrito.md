# Carrito — Zustand useCart Store

**Archivo fuente:** `store/useCart.ts:1-64`

## La idea

Store global de carrito de compras con persistencia en localStorage. Usado en la tienda, producto detalle y checkout. No requiere autenticación — el carrito sobrevive entre sesiones.

## Tecnología

- **Zustand** con middleware `persist`
- **localStorage** key: `manso-cart-storage`

## Tipos

```typescript
// store/useCart.ts:5-24
interface Product {
  id: string;
  nombre: string;
  precio: number;
  imagenes_urls: string[];
  stock?: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  total: () => number;
  checkout: () => void;
}
```

## Acciones

### `addItem(product)`

```typescript
// store/useCart.ts:30-52
```

1. Si el producto ya está en el carrito → incrementa `quantity` en 1
2. Si no → agrega nuevo `CartItem` con `quantity: 1`
3. Respeta `product.stock`: si `currentQuantity >= maxStock`, no agrega

### `removeItem(id)`

```typescript
// store/useCart.ts:53
set({ items: items.filter(item => item.id !== id) })
```

### `clearCart()`

```typescript
// store/useCart.ts:54
set({ items: [] })
```

Llamado después de completar el checkout.

### `total()`

```typescript
// store/useCart.ts:55
items.reduce((acc, item) => acc + item.precio * item.quantity, 0)
```

No es un estado — es una getter function recalculada en cada acceso.

### `checkout()`

```typescript
// store/useCart.ts:56-60
window.location.href = '/checkout';
```

Navegación hard (no `next/navigation`). Loggea en consola para debug.

## Dónde se usa

| Archivo | Uso |
|---------|-----|
| `components/Layout/Navbar.tsx:27` | Badge de items en el ícono del carrito |
| `components/shop/CartSidebar.tsx` | Panel lateral con resumen del carrito |
| `app/producto/[id]/page.tsx:27-28` | `addItem` al agregar producto |
| `app/checkout/page.tsx:20` | `items`, `total()`, `clearCart` |

## Persistencia

```typescript
// store/useCart.ts:62
persist(..., { name: 'manso-cart-storage' })
```

El carrito sobrevive a:
- Recargas de página
- Cierre del navegador
- Login/logout (no está ligado a la sesión)

**No** se sincroniza con el backend. Es puramente client-side.

## Edge cases

| Caso | Comportamiento |
|------|---------------|
| Agregar más items que el stock | No agrega (silencioso) |
| Producto sin campo `stock` | `maxStock = Number.MAX_SAFE_INTEGER` (sin límite) |
| localStorage no disponible | Zustand fallback a memoria (sin persistencia) |
| Checkout completado | `clearCart()` limpia todo |
| Carrito vacío en `/checkout` | Redirect a `/tienda` con 100ms delay |

## Relación con otros docs

- El checkout — `paginas/checkout.md`
- La tienda — `paginas/tienda.md`
