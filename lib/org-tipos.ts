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

/** Artistas con escenario y horario (del HTML "Hospitality artistas"). Si cambia el line-up, se edita acá. */
export const AREA_ARTISTAS = 'Artistas / hospitality';
export const LINEUP_HOSP = [
  { n: 'Mestizo', stage: 'El Edén', time: '16:00 — 17:30' },
  { n: 'kndr', stage: 'El Edén', time: '17:30 — 19:30' },
  { n: 'Ana Hagen', stage: 'El Edén', time: '19:30 — 21:30' },
  { n: 'Porti', stage: 'El Edén', time: '21:30 — 23:30' },
  { n: 'Grant Dell (UK)', stage: 'El Edén', time: '23:30 — 02:00' },
  { n: 'Malena', stage: 'El Edén', time: '02:00 — 04:00' },
  { n: 'qoa (live)', stage: 'Chill Microdancing', time: '15:00 — 16:00' },
  { n: 'Tom Terzi (hybrid)', stage: 'Chill Microdancing', time: '16:00 — 17:00' },
  { n: 'Mikjaylovka', stage: 'Chill Microdancing', time: '18:00 — 20:00' },
  { n: 'Matías Mauger b2b Sego', stage: 'Chill Microdancing', time: '20:00 — 22:00' },
  { n: 'Sam Naidu', stage: 'Chill Microdancing', time: '22:00 — 23:00' },
  { n: 'Ludmila', stage: 'Chill Microdancing', time: '23:00 — 01:00' },
  { n: 'Orquesta Aeropuertos', stage: 'Sound & Vision', time: '14:30 — 15:10' },
  { n: 'Mariano Moreira & Massimo Pasquini', stage: 'Sound & Vision', time: '15:30 — 16:30' },
  { n: 'Pipol (live)', stage: 'Sound & Vision', time: '16:45 — 18:00' },
  { n: 'Ácido Fácil (live)', stage: 'Sound & Vision', time: '18:10 — 19:30' },
] as const;
export const COMER_ARTISTA = ['Antes del set', 'Después del set'] as const;
export const COMER_CHARLA = ['Antes de la charla', 'Después de la charla'] as const;
/** Áreas del staff: las de la org y las operativas, sin la de artistas (que tiene su propio formulario). */
export const AREAS_STAFF = AREAS_COMIDA.filter((a) => a !== AREA_ARTISTAS);

/**
 * Los tres formularios de /org/comida comparten tabla, API y panel; `tipo` los
 * separa. Cada uno tiene su link con su propio código (ver `tokenComida`), así
 * que mandar el de staff no abre el de artistas.
 */
export const TIPOS_COMIDA = ['artistas', 'charlas', 'staff'] as const;
export type TipoComida = (typeof TIPOS_COMIDA)[number];
export const COMIDA_TIPOS: Record<TipoComida, { etiqueta: string; kicker: string; titulo: string; para: string; ruta: string; wa: string }> = {
  artistas: { etiqueta: 'Artistas', kicker: 'Hospitality · Artistas', titulo: 'Hospitality para artistas', para: 'los artistas', ruta: '/org/comida', wa: 'Completá tu hospitality para BLUR (te lleva 1 minuto)' },
  charlas: { etiqueta: 'Panel de charlas', kicker: 'Hospitality · Panel de charlas', titulo: 'Hospitality para el panel de charlas', para: 'el panel de charlas', ruta: '/org/comida/charlas', wa: 'Completá tu hospitality de la charla en BLUR (te lleva 1 minuto)' },
  staff: { etiqueta: 'Staff', kicker: 'Comida · Staff', titulo: 'Comida para el staff', para: 'el staff', ruta: '/org/comida/staff', wa: 'Completá tu comida para BLUR (te lleva 1 minuto)' },
};
export const esTipoComida = (t: unknown): t is TipoComida => (TIPOS_COMIDA as readonly unknown[]).includes(t);

export interface OrgComida {
  id: string;
  created_at: string;
  tipo: TipoComida;
  nombre: string;
  area: string;
  comidas: string[];
  dieta: string[];
  alergias: string | null;
  bebida: string[];
  extras: string | null;
  /** Artistas (escenario) y charlas (nombre de la charla o panel). */
  escenario: string | null;
  horario: string | null;
  comer: string | null;
  bebida_set: string | null;
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
