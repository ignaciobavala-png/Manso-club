/**
 * Contenido de /festival — la sección "Festival" del panel.
 *
 * Es una página de venta de entradas con identidad propia (no usa la paleta
 * ni el navbar de Manso). Mientras `publicado` sea false solo la ven admins.
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
  /** Foto a sangre entre el line-up y las entradas. Sin foto no se dibuja. */
  foto_url: string | null;
  /** Línea destacada debajo de la tabla, ej. "solo para mayores de 18". */
  aviso: string | null;
  /** Frase de cierre de la página. */
  lema: string | null;
  color_fondo: string;
  color_texto: string;
  color_acento: string;
  publicado: boolean;
}

export interface FestivalEscenario {
  id: string;
  nombre: string;
  artistas: string[];
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
  nombre: 'Manso Festival',
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
  color_fondo: '#12130E',
  color_texto: '#F1E9D6',
  color_acento: '#FF5A1F',
  publicado: false,
};
