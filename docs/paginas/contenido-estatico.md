# Contenido Estático — Manifiesto, Trabajá con Nosotros, Presentá tu Proyecto

Tres páginas independientes agrupadas porque comparten patrón: contenido estático o semi-estático con formularios, sin sistema de visibilidad ni auth compleja.

---

## `/manifiesto` — Manifiesto

**Archivo fuente:** `app/manifiesto/page.tsx:1-77`
**Lib:** `lib/manifiesto.ts` → `getManifiesto()`

### Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Server Component (async) |
| ISR | `revalidate = 60` |
| Datos | `manifiesto` table (single row, campo `contenido`) |

### Renderizado

```typescript
// app/manifiesto/page.tsx:23-26
const { contenido } = await getManifiesto();
const parrafos = contenido.trim() ? contenido.trim().split(/\n\n+/) : [];
```

El contenido se separa por doble salto de línea. El último párrafo tiene `font-medium` para énfasis.

**Placeholder:** Si no hay contenido, muestra 5 bloques de líneas skeleton (barras grises).

Footer fijo: "Buenos Aires — 2026".

---

## `/trabaja-con-nosotros` — Trabajá con Nosotros

**Archivo fuente:** `app/trabaja-con-nosotros/page.tsx:1-102`

### Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Server Component (async) |
| ISR | `revalidate = 60` |
| Cliente Supabase | `createClient()` directamente (no usa el helper del proyecto) |

### Data fetching

```typescript
// app/trabaja-con-nosotros/page.tsx:31-44
getOfertas():
  SELECT area, descripcion FROM ofertas_empleo
  WHERE activo = true ORDER BY orden

  // Fallback si no hay datos:
  fallbackAreas = [
    { area: 'Producción', descripcion: 'Coordinación de eventos...' },
    { area: 'Comunicación', descripcion: 'Gestión de redes...' },
    { area: 'Curaduría', descripcion: 'Selección y programación...' },
    { area: 'Técnica', descripcion: 'Sonido, iluminación...' },
  ]
```

### Renderizado

- Lista de áreas con nombre (columna izquierda, `text-manso-terra`) y descripción (derecha)
- Cada fila separada por `border-b border-manso-cream/10`
- CTA final: email `anahagen@mansoclub.com.ar` con ícono de flecha

---

## `/presenta-tu-proyecto` — Presentá tu Proyecto

**Archivo fuente:** `app/presenta-tu-proyecto/page.tsx:1-198`

### Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Client component (`'use client'`) |
| Auth | No requiere |
| Layout | `app/presenta-tu-proyecto/layout.tsx` — incluye `ParticleBackground` |

### Tabs

Dos pestañas con navegación interna (no son rutas separadas):

```typescript
// app/presenta-tu-proyecto/page.tsx:16
const [activeTab, setActiveTab] = useState<'propuesta' | 'cotizador'>('propuesta');
```

#### Tab 1: Propuesta

Formulario que inserta en la tabla `propuestas`:

| Campo | Tipo | Validación |
|-------|------|-----------|
| `nombre` | text | Required |
| `email` | email | Required |
| `tipo` | select | 'artista', 'taller', 'residencia', 'otro' |
| `descripcion` | textarea | Required, minLength 30 |
| `links` | text | Opcional |

```typescript
// app/presenta-tu-proyecto/page.tsx:33-41
INSERT INTO propuestas (nombre, email, tipo, descripcion, links)
```

**Estados:**
- Formulario activo: 5 campos + botón "Enviar propuesta"
- Enviado: ícono `CheckCircle` + "¡Recibimos tu propuesta!"
- Error: mensaje rojo

#### Tab 2: Cotizador

Renderiza `<CotizadorForm />` de `components/Cotizador/CotizadorForm.tsx`. Componente independiente para cotización de eventos.

## DB involucrada

| Tabla | Página | Operación |
|-------|--------|-----------|
| `manifiesto` | `/manifiesto` | SELECT |
| `ofertas_empleo` | `/trabaja-con-nosotros` | SELECT |
| `propuestas` | `/presenta-tu-proyecto` | INSERT |
