/** Tokens de la paleta habilitados para el fondo pleno del detalle. */
export const COLORES_ACENTO = ['terra', 'olive', 'blue', 'brown'] as const;
export type ColorAcento = (typeof COLORES_ACENTO)[number];

export interface Membresia {
  id: string;
  nombre: string;
  precio: number;
  periodo: 'mes' | 'año';
  /** Histórico. Sigue siendo el fallback de `descripcion_corta`. */
  descripcion: string;
  destacado: boolean;
  activo: boolean;
  orden: number;
  categoria: string;
  /** Ruta del detalle: /membresias/<slug>. */
  slug: string | null;
  /** Lo que se lee en la tarjeta (home y /membresias). */
  descripcion_corta: string | null;
  /** Lo que se lee en la página de detalle. */
  descripcion_completa: string | null;
  color_acento: ColorAcento | null;
  /** Cultural Manso: card de color pleno que rompe la grilla. */
  es_cultural: boolean;
  created_at: string;
  updated_at: string;
  membresia_beneficios?: MembresiaBeneficio[];
}

export interface MembresiaBeneficio {
  id: string;
  membresia_id: string;
  texto: string;
  incluido: boolean;
  orden: number;
}

export interface MembresiaForm {
  nombre: string;
  precio: number | string;
  periodo: 'mes' | 'año';
  descripcion: string;
  destacado: boolean;
  activo: boolean;
  orden: number | string;
  categoria: string;
  slug: string;
  descripcion_corta: string;
  descripcion_completa: string;
  color_acento: ColorAcento;
  es_cultural: boolean;
  beneficios: MembresiaBeneficio[];
}
