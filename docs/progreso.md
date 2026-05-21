# Progreso — Sesión 12/05/2026

## Rama: `cursor` (mergeada a `main`)

### Cursor Trail (Estela de Eco)
- **Archivo:** `components/ui/CursorTrail.tsx`
- Canvas-based cursor trail que dibuja líneas blancas estilo boceto a lápiz al mover el mouse.
- 3 pasadas ligeramente descentadas (efecto lápiz superpuesto) + motas de grafito.
- Se desactiva en la sección "Nuestro ADN" (`PorQueManso.tsx`) mediante `data-cursor-hidden`.
- Ejemplo de uso: se renderiza en `app/layout.tsx` antes del cierre de `<body>`.

### Ilustraciones decorativas — EventosHome
- **Archivo:** `components/Home/EventosHome.tsx`
- Se agregaron ~30 ilustraciones (48×48px) distribuidas en el centro del section `#eventos-section`.
- Usa un array de datos con `.map()` para renderizar imágenes estáticas (esfera, vinilo, ventana) y animadas (IMG_2693, IMG_2704, IMG_2706, IMG_2714) con framer-motion (flotación vertical).
- Filtro CSS `brightness(0) saturate(0) invert(1) brightness(4)` para blanco puro.
- Zona de exclusión alrededor del título "Eventos" (37%–53% vertical) para evitar superposición.

### Assets
- Ilustraciones en `public/ilustraciones/prod-ilustr/` (8 archivos PNG 1080×1080).
- Copias adicionales en `public/ilustraciones/`.

### Pendiente
- Ajustar distribución de ilustraciones si quedan espacios vacíos.
