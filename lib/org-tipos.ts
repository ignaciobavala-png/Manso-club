/**
 * Tipos y constantes de /org que también usa el navegador. Viven aparte de
 * `lib/org.ts` porque ese archivo importa `next/headers` (solo servidor): si un
 * componente de cliente importa un valor de ahí, el build falla.
 */

export const AREAS = ['Diseño', 'Producción', 'Técnica', 'Comunicación', 'Operaciones'] as const;
export const PRIORIDADES = ['Alta', 'Media', 'Baja'] as const;
export type Area = (typeof AREAS)[number];
export type Prioridad = (typeof PRIORIDADES)[number];

export interface OrgTarea {
  id: string;
  zona: string;
  zona_orden: number;
  area: Area;
  texto: string;
  prioridad: Prioridad;
  hecho: boolean;
  orden: number;
}
