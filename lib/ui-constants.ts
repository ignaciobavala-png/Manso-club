/**
 * Design System - Manso Club
 *
 * JERARQUÍA TIPOGRÁFICA:
 *   display    → Titulares grandes de sección (clamp fluid)
 *   hero       → Título del banner de home (Neue Montreal, centrado)
 *   h1         → Títulos de página
 *   h2         → Títulos de sección
 *   h3         → Subtítulos / Títulos de card principales
 *   h4         → Títulos de card secundarios
 *   body       → Texto corrido
 *   body-small → Texto secundario
 *   label      → Tags, etiquetas, metadata
 *   micro      → Copyright, indicadores pequeños
 *   badge      → Badges, contadores
 *
 * CONTRASTE:
 *   Fondo oscuro (#000000) → body = text-manso-cream/85
 *   Fondo claro (#FFFCDC)  → body = text-manso-black/85
 */

// ==========================================
// TOKENS DE COLOR
// ==========================================
export const COLOR = {
  bg: {
    black: 'bg-manso-black',
    blue: 'bg-manso-blue',
    terra: 'bg-manso-terra',
    olive: 'bg-manso-olive',
    cream: 'bg-manso-cream',
    brown: 'bg-manso-brown',
    white: 'bg-manso-white',
    gradient: 'bg-manso-gradient',
  },
  text: {
    black: 'text-manso-black',
    blue: 'text-manso-blue',
    terra: 'text-manso-terra',
    olive: 'text-manso-olive',
    cream: 'text-manso-cream',
    brown: 'text-manso-brown',
    white: 'text-manso-white',
  },
  border: {
    black: 'border-manso-black',
    blue: 'border-manso-blue',
    terra: 'border-manso-terra',
    olive: 'border-manso-olive',
    cream: 'border-manso-cream',
    brown: 'border-manso-brown',
    white: 'border-manso-white',
  },
} as const;

export const OPACITY = {
  onDark: 'text-manso-cream/85',
  onTerra: 'text-manso-cream/90',
  onLight: 'text-manso-black/85',
} as const;

// ==========================================
// TOKENS DE TIPOGRAFÍA
// ==========================================
export const TYPE = {
  // Sin `uppercase` a propósito: el título del hero respeta las mayúsculas y
  // minúsculas que Ana escribe en el panel. No volver a agregarlo.
  hero:
    'font-montreal text-hero font-black italic tracking-[-0.03em] leading-[1.05]',
  display:
    'text-display font-black uppercase italic tracking-[-0.04em] leading-[0.85]',
  h1:
    'text-h1 font-black uppercase italic tracking-[-0.03em] leading-none',
  h2:
    'text-h2 font-bold uppercase tracking-[-0.025em] leading-none',
  h3:
    'text-h3 font-bold uppercase tracking-[-0.02em] leading-[1.1]',
  h4:
    'text-h4 font-bold uppercase tracking-[-0.01em] leading-[1.2]',
  body:
    'text-body font-light leading-relaxed',
  bodySmall:
    'text-body-small font-light leading-relaxed',
  label:
    'text-label font-bold uppercase tracking-[0.5em]',
  micro:
    'text-micro font-bold uppercase tracking-[0.3em]',
  badge:
    'text-badge font-black uppercase tracking-[0.4em]',

  // Variantes de color de body
  bodyOnDark:
    'text-body font-light leading-relaxed text-manso-cream/85',
  bodyOnLight:
    'text-body font-light leading-relaxed text-manso-black/85',
} as const;

// ==========================================
// TOKENS DE LAYOUT
// ==========================================
export const LAYOUT = {
  container: 'max-w-7xl mx-auto px-6 md:px-12',
  containerNarrow: 'max-w-4xl mx-auto px-6 md:px-12',
  containerWide: 'max-w-[1400px] mx-auto px-6 md:px-12',
  section: 'min-h-screen overflow-y-auto snap-y snap-mandatory',
  snapSlide: 'snap-start',

  grid: {
    auto: 'grid grid-cols-1',
    two: 'grid grid-cols-1 md:grid-cols-2',
    three: 'grid grid-cols-1 md:grid-cols-3',
    four: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    responsive: 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3',
  } as const,
} as const;

// ==========================================
// TOKENS DE COMPONENTES
// ==========================================
export const BTN = {
  primary:
    'flex items-center gap-2 px-5 py-2.5 bg-manso-terra text-manso-cream rounded-full font-black uppercase tracking-wider text-xs hover:bg-manso-cream hover:text-manso-black transition-all',
  secondary:
    'flex items-center gap-2 px-4 py-2 bg-manso-black/80 backdrop-blur-sm text-manso-cream rounded-full font-medium uppercase tracking-wider text-xs hover:bg-manso-cream hover:text-manso-black transition-all',
  ghost:
    'flex items-center gap-2 px-4 py-2 text-manso-cream/60 hover:text-manso-cream transition-colors',
} as const;

export const CARD = {
  default: 'bg-zinc-50 rounded-[32px] border border-zinc-100 p-6 md:p-8',
  dark: 'bg-manso-black/80 backdrop-blur-sm rounded-[32px] border border-manso-cream/20 p-6 md:p-8',
  hover: 'group hover:bg-manso-black transition-all cursor-pointer',
} as const;

export const LINK = {
  default: 'text-manso-cream/60 hover:text-manso-cream transition-colors',
  nav: 'text-label font-medium text-manso-cream/60 hover:text-manso-cream transition-colors',
  social:
    'text-label text-manso-terra hover:text-manso-cream transition-colors duration-300',
} as const;

// ==========================================
// UTILIDADES
// ==========================================
export const FX = {
  outline: 'outline-text',
  gradient:
    'bg-gradient-to-r from-manso-terra to-manso-olive bg-clip-text text-transparent',
  pulse: 'animate-pulse',
  pulseSlow: 'animate-pulse-slow',
} as const;

// ==========================================
// EXPORT COMBINADO (backward compat)
// ==========================================
export const MANSO_UI = {
  colors: COLOR,
  typography: TYPE,
  layout: LAYOUT,
  components: { buttons: BTN, cards: CARD, links: LINK },
  utilities: FX,
} as const;

export type MansoColor = keyof typeof COLOR.bg;
export type MansoType = keyof typeof TYPE;
