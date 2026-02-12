# Plan: Secciones Adaptativas con Estilos Inteligentes

Este plan implementa secciones que se adaptan al contexto de la ruta, manteniendo coherencia visual entre el navbar inteligente y los fondos de las páginas.

## Problema Identificado

El navbar ya es inteligente para detectar páginas con fondo blanco, pero hay inconsistencias:

1. **Secciones nuevas** (about, agenda, artistas, membresias, tienda) usan `SectionLayout` con fondo blanco SIEMPRE
2. **Homepage** tiene múltiples fondos (hero oscuro, manifesto, sección blanca)
3. **Estilos de texto** en algunas secciones usan colores que no contrastan bien con fondo blanco
4. **Falta de coherencia** entre el navbar inteligente y los fondos reales de las páginas

## Solución Propuesta

### 1. Crear Componente AdaptiveSectionLayout
Reemplazar `SectionLayout` con un componente inteligente que:
- Detecte la ruta actual
- Aplique el fondo apropiado según el contexto
- Mantenga coherencia con los estilos del navbar
- Sea configurable para casos especiales

### 2. Definir Esquema de Fondos por Ruta
```
- / (home): Múltiples fondos (hero oscuro, manifesto, sección blanca)
- /about: Fondo claro con acentos manso
- /agenda: Fondo blanco (como está actualmente)
- /artistas: Fondo oscuro estilo galería
- /membresias: Fondo premium oscuro
- /tienda: Fondo blanco (como está actualmente)
- /mansoadm: Fondo oscuro admin
```

### 3. Actualizar Estilos de Texto
Asegurar que todos los textos tengan contraste adecuado:
- Textos sobre fondo oscuro: colores claros (white, cream, zinc-200/300)
- Textos sobre fondo claro: colores oscuros (black, zinc-800/900)

## Componentes a Modificar

### Nuevo: `components/ui/AdaptiveSectionLayout.tsx`
```typescript
interface AdaptiveSectionLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  customBg?: string; // Para casos especiales
  forceDark?: boolean; // Para forzar tema oscuro
}
```

### Modificar: `components/Layout/Navbar.tsx`
- Sincronizar la detección de fondos con el nuevo componente
- Asegurar que `isWhiteBgPage` coincida con los fondos reales

### Actualizar: Páginas existentes
- Reemplazar `SectionLayout` con `AdaptiveSectionLayout`
- Ajustar estilos de texto para mejor contraste

## Implementación Detallada

### AdaptiveSectionLayout Features
1. **Detección automática** de ruta actual
2. **Mapa de fondos** predefinidos por ruta
3. **Modo manual** para casos especiales
4. **Transiciones suaves** entre fondos
5. **Clases CSS consistentes** con el diseño Manso Club

### Esquema de Colores
```css
/* Fondos Oscuros */
.bg-manso-black      /* #1D1D1B */
.bg-manso-dark       /* #2D2D2B */

/* Fondos Claros */
.bg-white            /* #FFFFFF */
.bg-manso-cream      /* #F5F5F0 */

/* Textos */
.text-manso-black    /* Sobre fondos claros */
.text-manso-cream    /* Sobre fondos oscuros */
.text-zinc-400/600   /* Textos secundarios */
```

### Actualizaciones de Páginas
1. **About**: Fondo claro con mejor contraste
2. **Agenda**: Mantener fondo blanco pero ajustar textos
3. **Artistas**: Fondo oscuro estilo galería
4. **Membresias**: Fondo premium oscuro
5. **Tienda**: Mantener fondo blanco (ya funciona bien)

## Validaciones

### Testing Visual
- ✅ Contraste de texto en todas las páginas
- ✅ Coherencia con estilos del navbar
- ✅ Transiciones suaves entre secciones
- ✅ Responsive en todos los dispositivos

### Accesibilidad
- ✅ Ratio de contraste WCAG AA mínimo
- ✅ Textos legibles en todos los fondos
- ✅ Estados hover y focus visibles

## Impacto

Esta implementación resultará en:
- **Coherencia visual** total entre navbar y contenido
- **Mejor legibilidad** en todas las secciones
- **Experiencia unificada** para el usuario
- **Mantenimiento simplificado** con componente centralizado

El resultado será un sitio web visualmente coherente donde cada sección tiene el fondo apropiado y los textos siempre tienen el contraste correcto.
