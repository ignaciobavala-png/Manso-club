/**
 * Conteo de visitas de /blur. Los parámetros viven en `festival_conteo_config`
 * (una fila) y se editan desde el panel; ver supabase/migration_festival_conteo.sql
 * para qué hace cada uno.
 */
export interface ConteoConfig {
  activo: boolean;
  contar_clicks: boolean;
  contar_tiempo: boolean;
  solo_pestana_visible: boolean;
  inactividad_seg: number;
  tiempo_max_seg: number;
  heartbeat_seg: number;
  clicks_max_por_vista: number;
  excluir_admin: boolean;
  rutas_excluidas: string[];
  retencion_dias: number;
}

export const CONTEO_CONFIG_POR_DEFECTO: ConteoConfig = {
  activo: true,
  contar_clicks: true,
  contar_tiempo: true,
  solo_pestana_visible: true,
  inactividad_seg: 60,
  tiempo_max_seg: 1800,
  heartbeat_seg: 20,
  clicks_max_por_vista: 50,
  excluir_admin: true,
  rutas_excluidas: [],
  retencion_dias: 365,
};

export type Dispositivo = 'movil' | 'tablet' | 'escritorio';

/** Lo que manda el navegador a /api/festival/visitas. */
export interface CargaVisita {
  /** Id de la vista (uuid del navegador): el mismo en cada heartbeat. */
  id: string;
  visitante: string;
  sesion: string;
  path: string;
  idioma?: string;
  origen?: string;
  /** Milisegundos acumulados de la vista. */
  ms: number;
  /** Total de clicks de la vista hasta ahora. */
  clicks: number;
  /** Clicks con detalle, con su número de orden dentro de la vista. */
  detalle?: { n: number; e: string }[];
}

export interface ConteoResumen {
  vistas: number;
  visitantes: number;
  sesiones: number;
  segundos_prom: number | null;
  clicks: number;
}

export interface ConteoPantalla {
  path: string;
  vistas: number;
  visitantes: number;
  segundos_prom: number | null;
  segundos_mediana: number | null;
  segundos_total: number;
  clicks: number;
}

export interface ConteoClick {
  path: string;
  elemento: string;
  clicks: number;
}

export interface ConteoDia {
  dia: string;
  vistas: number;
  visitantes: number;
  clicks: number;
}

/** Nombre legible de una ruta del festival, para el panel. */
export function nombrePantalla(path: string): string {
  const fijas: Record<string, string> = {
    '/blur': 'Home',
    '/blur/vision': 'Visión',
    '/blur/locacion': 'Locación',
    '/blur/spots': 'Spots',
    '/blur/line-up': 'Line up',
    '/blur/tickets': 'Tickets',
    '/blur/info': 'Info & FAQ',
    '/blur/voluntarios': 'Voluntarios',
    '/blur/compra/:id': 'Compra',
  };
  if (fijas[path]) return fijas[path];
  if (path.startsWith('/blur/line-up/')) return `Artista · ${path.slice('/blur/line-up/'.length)}`;
  return path;
}
