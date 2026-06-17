# Sistema de Visibilidad — 3 Niveles

**Archivos fuente donde se implementa (4 lugares):**
- `app/artistas/[slug]/page.tsx:26-32, 136-150`
- `app/agenda/page.tsx:11-17, 59-103`
- `app/tienda/page.tsx:28-34, 36-72`
- `app/streaming/page.tsx:11-16, 18-48`

**Documento de planificación:** `comunidad/niveles-de-acceso.md`

## La idea

Mismo sitio, mismas URLs, mismo componente. El contenido se expande según el nivel del usuario que mira. Sin páginas nuevas ni redirecciones — solo más datos visibles para quien tiene sesión o membresía.

## Los 3 niveles

| Nivel | Quién | Qué ve (columna `visibilidad`) |
|-------|-------|-------------------------------|
| `publico` | Visitante sin cuenta | `'publico'` |
| `registrado` | Tiene cuenta gratuita | `'publico'`, `'registrado'` |
| `miembro` | Pagó membresía activa | `'publico'`, `'registrado'`, `'miembro'` |

## Código exacto (duplicado en 4 archivos)

```typescript
type Nivel = 'publico' | 'registrado' | 'miembro';

const NIVELES_VISIBLES: Record<Nivel, string[]> = {
  publico:    ['publico'],
  registrado: ['publico', 'registrado'],
  miembro:    ['publico', 'registrado', 'miembro'],
};
```

### Determinación del nivel

```typescript
// Server components
const supabaseServer = await createSupabaseServer();
const { data: { user } } = await supabaseServer.auth.getUser();

let nivel: Nivel = 'publico';
if (user) {
  const { data: profile } = await supabaseServer
    .from('user_profiles')
    .select('membresia_activa, membresia_hasta')
    .eq('id', user.id)
    .single();

  const activa = profile?.membresia_activa ?? false;
  const hasta  = profile?.membresia_hasta ?? null;
  nivel = activa && (!hasta || new Date(hasta) > new Date()) ? 'miembro' : 'registrado';
}

// Client components — mismo patrón pero con browser client
const { data: { user } } = await supabase.auth.getUser();
// ... misma lógica con user_profiles
```

### Aplicación en queries

```typescript
const nivelesVisibles = NIVELES_VISIBLES[nivel];

// Filtro por visibilidad
.in('visibilidad', nivelesVisibles)
```

### Detección de contenido oculto

```typescript
// Solo si no es miembro — para mostrar el gate banner
if (nivel !== 'miembro') {
  const { data } = await supabase
    .from('tabla')
    .select('visibilidad')
    .eq('activo', true);
  hayOcultos = data.some(item => !nivelesVisibles.includes(item.visibilidad));
}
```

## Gate banner (contenido oculto)

Todas las páginas usan el mismo patrón de banner:

| Nivel actual | Icono | Color | Mensaje | CTA | Link |
|-------------|-------|-------|---------|-----|------|
| `publico` | `Users` | `manso-blue` | "Hay X exclusivos para miembros registrados" | "Registrarse" | `/login` |
| `registrado` | `Lock` | `manso-terra` | "Hay X exclusivos para miembros" | "Ver membresías" | `/membresias` |

El banner no aparece para miembros (ven todo).

## Tablas con columna `visibilidad`

| Tabla | Estado |
|-------|--------|
| `artistas_tracks` | Implementado |
| `agenda` | Implementado |
| `productos` | Implementado |
| `streaming_contenido` | Implementado |
| `eventos_home` | Pendiente (según `comunidad/switch-publico-comunidad.md`) |
| `multimedia_videos` | Pendiente |

## Dónde NO se usa visibilidad

- `/multimedia` — usa división binaria: logueado / no logueado (campo `fue_transmitido`)
- `/ticket/[codigo]` — acceso público por código
- `/checkout` — no requiere auth
- `/membresias` — contenido siempre público
- `/manifiesto`, `/trabaja-con-nosotros`, `/presenta-tu-proyecto` — siempre públicos

## Duplicación y posible refactor

La lógica de `NIVELES_VISIBLES` y determinación de nivel está copiada 4 veces (2 server, 2 client). Un refactor posible: extraer a `lib/nivel.ts` con:

```typescript
export async function getNivel() { ... }       // server
export async function useNivel() { ... }       // client
export const NIVELES_VISIBLES = { ... };
```

## Relación con otros docs

- Planificación original — `comunidad/niveles-de-acceso.md`
- Switch público/comunidad en admin — `comunidad/switch-publico-comunidad.md`
- Autenticación — `sistemas/autenticacion.md`
