# Checkout — `/checkout`

**Archivo fuente:** `app/checkout/page.tsx:1-537`
**Layout (noindex):** `app/checkout/layout.tsx`

## La idea

Página de finalización de compra. El usuario completa sus datos personales, ve el resumen del carrito y los datos bancarios, y confirma el pedido. El backend guarda el pedido en `pedidos` con estado `pendiente_pago` y deriva al cliente a WhatsApp.

No requiere autenticación — cualquiera con productos en el carrito puede hacer checkout.

## Flujo del usuario

```
Carrito con productos → /checkout
  ├── Ve formulario (nombre, email, teléfono, DNI, dirección)
  ├── Ve resumen del pedido con total
  ├── Ve datos bancarios (CBU, alias, titular, banco)
  ├── Confirma → POST /api/checkout/notify
  │                ├── Guarda pedido en tabla pedidos (estado: pendiente_pago)
  │                └── Limpia carrito (Zustand + localStorage)
  └── Redirige a WhatsApp (cliente) después de 3s
```

## Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Client component (`'use client'`) |
| Estado | 3 estados locales: `loadingConfig`, `isSubmitting`, `isSubmitted` |
| Layout | Fondo blanco (`bg-white`), centrado en columna |

### Estados de la UI

1. **Cargando configuración** (`loadingConfig === true`): Spinner centrado, "Cargando configuración..."
2. **Formulario activo**: Layout de 2 columnas (formulario izquierda, resumen derecha)
3. **Enviado** (`isSubmitted === true`): Check verde, "¡Pedido Recibido!", redirige a WhatsApp en 3s
4. **Carrito vacío** (`items.length === 0`): Redirect automático a `/tienda` (con delay de 100ms para esperar hidratación)

## Formulario

### Campos (`app/checkout/page.tsx:10-16`)

| Campo | Validación |
|-------|-----------|
| `nombre` | Requerido, no vacío |
| `mail` | Requerido, regex email |
| `telefono` | Requerido, no vacío |
| `dni` | Requerido, 8 dígitos (formato `XXXXXXXX` o `XX.XXX.XXX`) |
| `direccion` | Requerido, mínimo 10 caracteres |

Mensajes de error por campo en `app/checkout/page.tsx:86-120`.

### Datos bancarios

Se obtienen de `/api/checkout/config` (GET). Se muestran en una card secundaria (fondo gris claro):

- `banco_nombre` (fallback: "Banco Galicia")
- `banco_cbu` (fallback: "0070053430000001234567")
- `banco_alias` (fallback: "MANSO.CLUB.TIENDA")
- `banco_titular` (fallback: "MANSO CLUB S.A.")
- `banco_cuit` (opcional, solo si existe)

Endpoint de config: `app/api/checkout/config/route.ts`

### Formateo de precios

Usa `Intl.NumberFormat` con locale `es-AR` o `en-US` según la moneda (`config.moneda`, default ARS). Sin decimales. `app/checkout/page.tsx:65-74`.

## Resumen del pedido

- Columna derecha sticky (`lg:sticky lg:top-8`)
- Muestra cada ítem del carrito con nombre, cantidad, precio unitario y subtotal
- Total en card negra destacada
- Método de pago: "Transferencia bancaria" + "Contactar por WhatsApp"
- Botón WhatsApp directo (no espera al submit)
- Trust signals: envío, pago seguro, devoluciones 30 días

## Envío del pedido

### POST a `/api/checkout/notify` (`app/checkout/page.tsx:151-163`)

Envía un JSON con:
```typescript
{
  mensaje: string,        // texto formateado para WhatsApp
  cliente: CheckoutForm,  // nombre, mail, telefono, dni, direccion
  productos: CartItem[],  // id, nombre, precio, quantity
  total: number,
  config: any             // configuración bancaria
}
```

### Qué hace el backend (`app/api/checkout/notify/route.ts`)

1. Valida que existan `mensaje`, `cliente` y `productos`
2. Usa **service_role key** para escribir en `pedidos` (no requiere auth del cliente)
3. Inserta en tabla `pedidos`:
   ```typescript
   {
     cliente_nombre, cliente_email, cliente_telefono,
     cliente_dni, cliente_direccion,
     productos: JSON,       // array de ítems
     total: number,
     estado: 'pendiente_pago',
     mensaje_whatsapp: string,
     created_at: ISO string
   }
   ```
4. Loggea en consola los datos del pedido
5. Retorna `{ success: true, pedido_id }`

### Post-envío

- `clearCart()`: limpia Zustand + localStorage
- `setTimeout(3000)`: abre WhatsApp del cliente con mensaje pre-escrito
- El número de WhatsApp viene de `lib/constants.ts:WHATSAPP_NUMBER`

## DB involucrada

| Tabla | Operación | Auth |
|-------|-----------|------|
| `checkout_config` | SELECT (via `/api/checkout/config`) | Público |
| `pedidos` | INSERT (via `/api/checkout/notify`) | Service role |

No toca `ordenes`, `orden_items` ni `tickets`. Esos pertenecen al flujo de Mercado Pago (hoy no usado).

## Integración con el carrito

- `useCart` de Zustand: `app/checkout/page.tsx:20` — lee `items`, `total()`, `clearCart`
- Si el carrito está vacío al montar (post-hidratación): redirect a `/tienda`
- El store persiste en localStorage con key `manso-cart-storage` (`store/useCart.ts:62`)

## Edge cases

| Caso | Comportamiento |
|------|---------------|
| Carrito vacío al entrar | Redirect a `/tienda` (100ms delay para esperar hidratación de Zustand) |
| Error al cargar config bancaria | `console.error`, sigue con fallbacks hardcodeados |
| Error al guardar pedido | `console.error`, se muestra mensaje de error al usuario |
| Pedido guardado pero WhatsApp no abre | El pedido ya está en DB, el cliente puede contactar manualmente |
| DNI mal formateado | Error de validación, no se envía |

## Relación con otros docs

- El carrito está documentado en `sistemas/carrito.md` (pendiente)
- La configuración bancaria en `sistemas/api.md` (pendiente)
- El navbar se oculta en esta página (`isLightBgPage` en Navbar)
