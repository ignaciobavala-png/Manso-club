/**
 * Constantes de UI para Manso Club
 * Centraliza todas las clases de Tailwind utilizadas frecuentemente
 * para mantener consistencia y facilitar mantenimiento
 */

// Colores personalizados Manso
export const MANSO_COLORS = {
  // Background colors
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
  
  // Text colors
  text: {
    black: 'text-manso-black',
    blue: 'text-manso-blue',
    terra: 'text-manso-terra', 
    olive: 'text-manso-olive',
    cream: 'text-manso-cream',
    brown: 'text-manso-brown',
    white: 'text-manso-white',
  },
  
  // Border colors
  border: {
    black: 'border-manso-black',
    blue: 'border-manso-blue',
    terra: 'border-manso-terra',
    olive: 'border-manso-olive', 
    cream: 'border-manso-cream',
    brown: 'border-manso-brown',
    white: 'border-manso-white',
  },
  
  // Opacidad variants
  withOpacity: {
    terra: {
      80: 'bg-manso-terra/80',
      60: 'bg-manso-terra/60',
      40: 'bg-manso-terra/40',
      20: 'bg-manso-terra/20',
    },
    cream: {
      80: 'text-manso-cream/80',
      60: 'text-manso-cream/60', 
      40: 'text-manso-cream/40',
      20: 'text-manso-cream/20',
    },
    black: {
      80: 'text-manso-black/80',
      60: 'text-manso-black/60',
      40: 'text-manso-black/40',
      20: 'text-manso-black/20',
    }
  }
} as const;

// Tipografía
export const MANSO_TYPOGRAPHY = {
  // Font families
  fonts: {
    sans: 'font-sans',
    helvetica: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  
  // Tamaños de texto comunes
  sizes: {
    xs: 'text-[10px]',
    sm: 'text-sm', 
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl',
  },
  
  // Font weights
  weights: {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    black: 'font-black',
  },
  
  // Estilos de texto
  styles: {
    uppercase: 'uppercase',
    italic: 'italic',
    tracking: {
      tight: 'tracking-tighter',
      normal: 'tracking-normal',
      wide: 'tracking-widest',
      widest: 'tracking-[0.5em]',
      ultra: 'tracking-[0.4em]',
    },
    leading: {
      tight: 'leading-none',
      normal: 'leading-normal',
      relaxed: 'leading-relaxed',
    }
  },
  
  // Combinaciones frecuentes
  combos: {
    // Headers
    h1: 'text-3xl md:text-5xl lg:text-6xl font-black uppercase italic tracking-tighter leading-none',
    h2: 'text-xl font-bold uppercase tracking-tighter leading-none',
    h3: 'text-lg font-black uppercase tracking-wider',
    
    // Labels y metadata
    label: 'text-[10px] font-bold uppercase tracking-widest',
    subtitle: 'text-[10px] font-black uppercase tracking-[0.5em]',
    small: 'text-[8px] uppercase tracking-[0.3em]',
    
    // Body text
    body: 'text-base text-manso-cream/70 leading-relaxed font-light',
    bodyMedium: 'text-base md:text-lg text-manso-cream/70 leading-relaxed font-light',
  }
} as const;

// Layout
export const MANSO_LAYOUT = {
  // Containers
  containers: {
    page: 'min-h-screen',
    section: 'min-h-screen overflow-y-auto snap-y snap-mandatory',
    snapSlide: 'snap-start',
    centered: 'max-w-7xl mx-auto px-6 md:px-12',
    narrow: 'max-w-4xl mx-auto px-6 md:px-12',
    wide: 'max-w-[1400px] mx-auto px-6 md:px-12',
  },
  
  // Grid systems
  grids: {
    auto: 'grid grid-cols-1',
    two: 'grid grid-cols-1 md:grid-cols-2',
    three: 'grid grid-cols-1 md:grid-cols-3',
    four: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    responsive: 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3',
  },
  
  // Flexbox
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start',
    end: 'flex items-center justify-end',
    col: 'flex flex-col',
    colCenter: 'flex flex-col items-center justify-center',
    row: 'flex flex-row',
    wrap: 'flex flex-wrap',
  },
  
  // Spacing
  spacing: {
    padding: {
      xs: 'p-2',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-12',
    },
    margin: {
      xs: 'm-2',
      sm: 'm-4', 
      md: 'm-6',
      lg: 'm-8',
      xl: 'm-12',
    },
    gap: {
      xs: 'gap-2',
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8',
      xl: 'gap-12',
    }
  },
  
  // Borders y rounded
  borders: {
    none: 'border-0',
    thin: 'border',
    thick: 'border-2',
    rounded: {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full',
      manso: 'rounded-[32px]', // Esquina redondeada característica
    }
  },
  
  // Sombras
  shadows: {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  },
  
  // Transiciones
  transitions: {
    colors: 'transition-colors duration-300',
    transform: 'transition-transform duration-300',
    all: 'transition-all duration-300',
    hover: 'hover:transition-all',
  }
} as const;

// Componentes UI comunes
export const MANSO_COMPONENTS = {
  // Botones
  buttons: {
    primary: 'flex items-center gap-2 px-5 py-2.5 bg-manso-terra text-manso-cream rounded-full font-black uppercase tracking-wider text-xs hover:bg-manso-cream hover:text-manso-black transition-all',
    secondary: 'flex items-center gap-2 px-4 py-2 bg-manso-black/80 backdrop-blur-sm text-manso-cream rounded-full font-medium uppercase tracking-wider text-xs hover:bg-manso-cream hover:text-manso-black transition-all',
    ghost: 'flex items-center gap-2 px-4 py-2 text-manso-cream/60 hover:text-manso-cream transition-colors',
  },
  
  // Cards
  cards: {
    default: 'bg-zinc-50 rounded-[32px] border border-zinc-100 p-6 md:p-8',
    dark: 'bg-manso-black/80 backdrop-blur-sm rounded-[32px] border border-manso-cream/20 p-6 md:p-8',
    hover: 'group hover:bg-manso-black transition-all cursor-pointer',
  },
  
  // Links
  links: {
    default: 'text-manso-cream/60 hover:text-manso-cream transition-colors',
    nav: 'text-[10px] uppercase tracking-widest font-medium text-manso-cream/60 hover:text-manso-cream transition-colors',
    social: 'text-[10px] uppercase tracking-widest text-manso-terra hover:text-manso-cream transition-colors duration-300',
  },
  
  // Indicadores
  indicators: {
    music: 'absolute top-4 right-4 w-8 h-8 bg-manso-terra/80 backdrop-blur-sm rounded-full flex items-center justify-center',
    badge: 'text-[10px] font-bold uppercase tracking-widest text-manso-terra',
    status: 'text-[10px] uppercase tracking-widest text-zinc-500',
  }
} as const;

// Utilidades especiales
export const MANSO_UTILITIES = {
  // Efectos de texto
  text: {
    outline: 'outline-text',
    gradient: 'bg-gradient-to-r from-manso-terra to-manso-olive bg-clip-text text-transparent',
  },
  
  // Animaciones
  animations: {
    pulse: 'animate-pulse',
    pulseSlow: 'animate-pulse-slow',
    fadeIn: 'animate-fade-in',
  },
  
  // Estados interactivos
  states: {
    hover: {
      lift: 'hover:-translate-y-1',
      slide: 'hover:translate-x-1',
      scale: 'hover:scale-105',
    },
    focus: {
      ring: 'focus:ring-2 focus:ring-manso-terra',
      outline: 'focus:outline-none',
    }
  }
} as const;

// Exportaciones combinadas para uso rápido
export const MANSO_UI = {
  colors: MANSO_COLORS,
  typography: MANSO_TYPOGRAPHY,
  layout: MANSO_LAYOUT,
  components: MANSO_COMPONENTS,
  utilities: MANSO_UTILITIES,
} as const;

// Tipos TypeScript para autocompletado
export type MansoColor = keyof typeof MANSO_COLORS.bg;
export type MansoTypography = keyof typeof MANSO_TYPOGRAPHY.combos;
export type MansoComponent = keyof typeof MANSO_COMPONENTS.buttons;
