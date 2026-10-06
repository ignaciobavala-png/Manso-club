/**
 * Contenido de /festival — la sección "Festival" del panel.
 *
 * Es un sitio chico con identidad propia (no usa el navbar de Manso): hero,
 * visión, locación, line-up con una página por artista, tickets e info. Mientras
 * `publicado` sea false solo lo ven admins.
 */

/** Datos generales. Fila única (`id` = 1). */
export interface FestivalConfig {
  id: number;
  nombre: string;
  bajada: string | null;
  /** `YYYY-MM-DD`, sin hora: el horario va aparte como texto libre. */
  fecha: string | null;
  horario: string | null;
  lugar: string | null;
  direccion: string | null;
  flyer_url: string | null;
  /** Fondo del hero. Sin banner, el hero queda en el color de fondo. */
  banner_url: string | null;
  /** Foto de /festival/locacion, con marco de foto revelada. */
  foto_url: string | null;
  /** Línea destacada debajo de la tabla, ej. "solo para mayores de 18". */
  aviso: string | null;
  /** Segunda cajita del hero, debajo de la fecha. */
  lema: string | null;
  /** Texto de /festival/vision. Ver `TextoResaltado` para la marca de color. */
  vision: string | null;
  /** Texto de /festival/locacion. */
  locacion: string | null;
  /** Usuario de Instagram, sin @. */
  instagram: string | null;
  /** Mail de contacto del pie y de la FAQ. */
  email: string | null;
  color_fondo: string;
  color_texto: string;
  color_acento: string;
  /** Color de las palabras resaltadas con *asteriscos*. */
  color_resalte: string;
  publicado: boolean;
}

export interface FestivalEscenario {
  id: string;
  nombre: string;
  orden: number;
  activo: boolean;
}

/** Un artista del line-up, con página propia en /festival/line-up/[slug]. */
export interface FestivalArtista {
  id: string;
  slug: string;
  nombre: string;
  escenario_id: string | null;
  /** Toca B2B con el artista anterior del mismo escenario. */
  b2b: boolean;
  /** Código corto ("AR", "DE") que va al lado del nombre en el line-up. */
  pais: string | null;
  /** Línea debajo del nombre: "Berlín — Techno / Dub". */
  origen: string | null;
  foto_url: string | null;
  bio: string | null;
  dia: string | null;
  horario: string | null;
  instagram: string | null;
  soundcloud: string | null;
  resident_advisor: string | null;
  orden: number;
  activo: boolean;
}

/** Una pregunta de /festival/info. */
export interface FestivalFaq {
  id: string;
  titulo: string;
  texto: string;
  orden: number;
  activo: boolean;
}

export type EstadoEntrada = 'en_venta' | 'agotado' | 'finalizado' | 'proximamente';

/** Un tipo de entrada: una fila de la tabla de venta. */
export interface FestivalEntrada {
  id: string;
  nombre: string;
  descripcion: string | null;
  /** Precio de la unidad en pesos. En un pack es el del pack entero. */
  precio: number;
  /** Cuántas entradas trae una unidad: 1 para las sueltas, N para "Pack xN". */
  entradas_por_unidad: number;
  max_por_compra: number;
  estado: EstadoEntrada;
  orden: number;
  activo: boolean;
}

export const ESTADOS_ENTRADA: { valor: EstadoEntrada; etiqueta: string }[] = [
  { valor: 'en_venta', etiqueta: 'En venta' },
  { valor: 'proximamente', etiqueta: 'Próximamente' },
  { valor: 'agotado', etiqueta: 'Agotado' },
  { valor: 'finalizado', etiqueta: 'Finalizado' },
];

export const etiquetaEstado = (estado: EstadoEntrada) =>
  ESTADOS_ENTRADA.find(e => e.valor === estado)?.etiqueta ?? estado;

export const CONFIG_FESTIVAL_VACIA: FestivalConfig = {
  id: 1,
  nombre: 'Subreal',
  bajada: null,
  fecha: null,
  horario: null,
  lugar: null,
  direccion: null,
  flyer_url: null,
  banner_url: null,
  foto_url: null,
  aviso: null,
  lema: null,
  vision: null,
  locacion: null,
  instagram: null,
  email: null,
  color_fondo: '#1C1410',
  color_texto: '#FFFCDC',
  color_acento: '#E2532B',
  color_resalte: '#B9B23E',
  publicado: false,
};
