/**
 * Tipos y constantes de /org que también usa el navegador. Viven aparte de
 * `lib/org.ts` porque ese archivo importa `next/headers` (solo servidor): si un
 * componente de cliente importa un valor de ahí, el build falla.
 */

export const AREAS = ['Diseño', 'Producción', 'Técnica', 'Comunicación', 'Operaciones'] as const;
export const PRIORIDADES = ['Alta', 'Media', 'Baja'] as const;
export type Area = (typeof AREAS)[number];
export type Prioridad = (typeof PRIORIDADES)[number];

/** Formulario de comida (/org/comida). Las opciones viven acá para que las compartan el form, la API y el panel. */
export const COMIDAS = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Madrugada'] as const;
export const DIETAS = ['Como de todo', 'Vegetariana', 'Vegana', 'Sin TACC', 'Sin lactosa'] as const;
export const BEBIDAS = ['Agua con gas', 'Mate', 'Jugos / gaseosas', 'Energizante', 'Vino', 'Gin tonic', 'Fernet', 'Cerveza'] as const;
/** Áreas de la org para el formulario; "Otra" por si alguien no entra en ninguna. */
export const AREAS_COMIDA = [...AREAS, 'Artistas / hospitality', 'Seguridad', 'Barras', 'Voluntariado', 'Otra'] as const;

export interface OrgComida {
  id: string;
  created_at: string;
  nombre: string;
  area: string;
  comidas: string[];
  dieta: string[];
  alergias: string | null;
  bebida: string[];
  extras: string | null;
}

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
