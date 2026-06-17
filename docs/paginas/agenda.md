# Agenda — `/agenda` y `/agenda/pagar`

**Archivos fuente:**
- Agenda: `app/agenda/page.tsx:1-363`
- Pago: `app/agenda/pagar/page.tsx:1-108`
- Layout: `app/agenda/layout.tsx`

## `/agenda` — Programación

### Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Client component (`'use client'`) |
| Revalidación | Client-side fetch on mount (`useEffect`, sin ISR) |
| Cliente Supabase | Browser client (`@/lib/supabase` → `supabase`) |

### Sistema de visibilidad

Mismo patrón de 3 niveles documentado en `sistemas/visibilidad.md` y `artistas.md`:

```typescript
// app/agenda/page.tsx:11-17
type Nivel = 'publico' | 'registrado' | 'miembro';
const NIVELES_VISIBLES: Record<Nivel, string[]> = {
  publico:    ['publico'],
  registrado: ['publico', 'registrado'],
  miembro:    ['publico', 'registrado', 'miembro'],
};
```

### Data fetching

```typescript
// app/agenda/page.tsx:59-103 — 3 queries en Promise.all

agenda:
  SELECT * FROM agenda
  WHERE activo = true AND visibilidad IN (nivelesVisibles)
  ORDER BY created_at

todas las visibilidades (solo si nivel !== 'miembro'):
  SELECT visibilidad FROM agenda WHERE activo = true

eventos (flyers):
  SELECT * FROM eventos WHERE activo = true ORDER BY fecha
```

### Estados

| Estado | UI |
|--------|-----|
| Loading | Spinner + "Cargando programa..." |
| Vacío | "Sin eventos programados" + mensaje de temporada |
| Con datos | Grupos por categoría con filas de eventos |

### UI

- Header: "Manso Club" + "Agenda" + mes/año actual calculado con `new Date()`
- `MESES` array hardcodeado: Enero a Diciembre (`app/agenda/page.tsx:46`)
- Eventos agrupados por `categoria` (o "Eventos" si no tiene)
- Cada fila: título, descripción, frecuencia, duración, cupos, precio, botón "Inscribirme"
- El botón "Inscribirme" linkea a `/agenda/pagar?titulo=&precio=&frecuencia=&categoria=`
- Carrusel horizontal de flyers con imágenes (`eventos.imagen_url`), badges TICKETS (disponible) o SOLD OUT
- Footer: "Manso Club — Buenos Aires" + "Programación sujeta a cambios"

### Gate de contenido oculto

Mismo patrón que en `artistas/[slug]` (`app/agenda/page.tsx:265-297`):
- Público → "Hay eventos exclusivos para miembros registrados" + botón "Registrarse" → `/login`
- Registrado → "Hay eventos exclusivos para miembros" + botón "Ver membresías" → `/membresias`

## `/agenda/pagar` — Pago de evento

### Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Server Component (async) |
| Cliente Supabase | No usa — usa `getBankConfig()` de `lib/getBankConfig.ts` |
| SEO | `robots: { index: false }` |

### Parámetros (searchParams)

```typescript
// app/agenda/pagar/page.tsx:16
{ titulo?: string; precio?: string; frecuencia?: string; categoria?: string }
```

Vienen del link "Inscribirme" en la agenda.

### Contenido

1. Back link a `/agenda`
2. Categoría + nombre del evento + frecuencia
3. Si `precio > 0`: muestra el monto y datos bancarios (misma card que en `/membresias/pagar`)
4. Si `precio === 0` o sin precio: solo WhatsApp
5. Botón WhatsApp con mensaje pre-escrito:
   - Con pago: "Me quiero inscribir en {titulo} (${precio}). Adjunto comprobante."
   - Sin pago: "Me quiero inscribir en {titulo}. ¿Cómo procedo?"

### Datos bancarios

Misma fuente que checkout y membresías/pagar: `getBankConfig()` → `checkout_config` table. Los campos mostrados: `banco_nombre`, `banco_titular`, `banco_cuit`, `banco_cbu`, `banco_alias`. Cada uno con `CopyButton`.

## DB involucrada

| Tabla | Ruta | Filtro |
|-------|------|--------|
| `agenda` | `/agenda` | `activo = true`, `visibilidad IN (...)` |
| `eventos` | `/agenda` | `activo = true` |
| `user_profiles` | `/agenda` | `id = auth.uid()` (para nivel) |
| `checkout_config` | `/agenda/pagar` | Single row (config bancaria) |

## Relación con otros docs

- El sistema de visibilidad — `sistemas/visibilidad.md`
- El patrón de pago por transferencia se repite en `/membresias/pagar` y `/checkout`
