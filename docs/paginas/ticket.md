# Ticket Digital — `/ticket/[codigo]`

**Archivo fuente:** `app/ticket/[codigo]/page.tsx:1-217`
**API de descarga:** `app/api/ticket/download/[codigo]/route.ts`

## La idea

Página pública que muestra un ticket digital con QR para validación en eventos. Cualquiera con el código puede acceder — no requiere autenticación. El QR se genera server-side con la librería `qrcode`.

## Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Server Component (async) |
| Revalidación | `dynamic = 'force-dynamic'` (implícito por `params`) |
| Cliente Supabase | `createSupabaseAnon()` (sin auth) |
| SEO | `generateMetadata` dinámico con código del ticket |

## Data fetching

```typescript
// app/ticket/[codigo]/page.tsx:16-27
SELECT *, ordenes(created_at, total)
FROM tickets
WHERE codigo = UPPER(?)
```

El código se normaliza a mayúsculas con `codigo.toUpperCase()`. Join con la tabla `ordenes` para obtener `created_at` y `total`.

Si no encuentra el ticket → `notFound()` (página 404 de Next.js).

## QR Code

```typescript
// app/ticket/[codigo]/page.tsx:34-41
QRCode.toDataURL(codigo, {
  width: 200,
  margin: 2,
  color: { dark: '#1D1D1B', light: '#F5E6D3' },
})
```

Se genera como data URL y se pasa a `next/image` para renderizado. Colores: QR oscuro sobre fondo crema.

## Secciones del ticket

### Header
- "Manso Club" + "Ticket Digital"

### Ticket Card (fondo `bg-manso-cream/10`)

1. **Nombre del evento** (`ticket.evento_nombre`) + tipo (`ticket.tipo`: 'entrada', 'membresia', 'Producto')
2. **Badge de validez**: verde "Válido" o rojo "Usado" según `ticket.usado`
3. **Info grid 2 columnas**:
   - Izquierda: Nombre, Email, Fecha de compra, Total pagado
   - Derecha: QR code (200x200px) + código debajo
4. **Código único**: display grande centrado
5. **Botones de acción**:
   - "Imprimir Ticket" → `window.print()`
   - "Descargar como Imagen" → `fetch(/api/ticket/download/CODIGO)` → blob → download

### Footer
- Texto legal: "Este ticket es válido para la entrada al evento"
- "Presenta este código QR en la entrada para su validación"
- "Manso Club • www.manso.club"

## API de descarga: `/api/ticket/download/[codigo]`

Genera un PNG del ticket usando la librería `canvas` (server-side). El endpoint:

1. Busca el ticket por código
2. Crea un canvas con el diseño del ticket
3. Retorna el PNG como response con headers `Content-Type: image/png` y `Content-Disposition: attachment`

## Estados

| Caso | Comportamiento |
|------|---------------|
| Ticket encontrado | Página completa con QR |
| Ticket no encontrado | `notFound()` → 404 |
| Ticket usado | Badge rojo "Usado" en vez de verde |

## DB involucrada

| Tabla | Operación | Nota |
|-------|-----------|------|
| `tickets` | SELECT por código | Join con `ordenes` para created_at y total |
| `ordenes` | SELECT (anidado) | Solo `created_at` y `total` |

La tabla `tickets` contiene: `id`, `codigo`, `evento_nombre`, `tipo`, `nombre`, `email`, `usado`, `ordenes`.
