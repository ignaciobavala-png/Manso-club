/**
 * Contenido de /blur — la sección "Festival" del panel.
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
  /** Obsoleta: la reemplazó `locacion_fotos`. Queda en la tabla, nadie la lee. */
  foto_url: string | null;
  /** Galería de /blur/locacion, en el orden en que se muestra. */
  locacion_fotos: string[];
  /** Fotos que el home muestra después de las de Locación. */
  home_fotos: string[];
  /** Línea destacada debajo de la tabla, ej. "solo para mayores de 18". */
  aviso: string | null;
  /** Segunda cajita del hero, debajo de la fecha. */
  lema: string | null;
  /** Texto de /blur/vision. Ver `TextoResaltado` para la marca de color. */
  vision: string | null;
  /** Texto de /blur/locacion. */
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
  /** Apagado, el line-up no se ve (todavía no está cerrado). Ver `leerLineup`. */
  lineup_visible: boolean;
  /** Perillas de los medios de cobro. Ver `mediosDePago` en lib/festival-compra. */
  pago_mercadopago: boolean;
  pago_transferencia: boolean;
  /** Apagada hasta que estén las wallets (`FESTIVAL_WALLET_*`). */
  pago_cripto: boolean;
}

export type MedioPago = 'mercadopago' | 'transferencia' | 'cripto';

export const MEDIOS_PAGO: Record<MedioPago, { nombre: string; boton: string; detalle: string }> = {
  mercadopago: {
    nombre: 'Mercado Pago',
    boton: 'Pagar con Mercado Pago',
    detalle: 'Tarjeta, débito o dinero en cuenta. Las entradas llegan apenas se aprueba el pago.',
  },
  transferencia: {
    nombre: 'Transferencia',
    boton: 'Pagar por transferencia',
    detalle: 'Te mostramos los datos de la cuenta. Las entradas llegan cuando confirmamos la transferencia.',
  },
  cripto: {
    nombre: 'Cripto',
    boton: 'Pagar con cripto',
    detalle: 'USDT o USDC en la red que elijas, al dólar blue del momento.',
  },
};

export interface FestivalEscenario {
  id: string;
  nombre: string;
  orden: number;
  activo: boolean;
}

/** Un artista del line-up, con página propia en /blur/line-up/[slug]. */
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
  /** Link de YouTube tal como se pegó; la página lo muestra embebido. */
  youtube_url: string | null;
  orden: number;
  activo: boolean;
}

/** Un lugar de la fiesta en /blur/spots: título, texto y fotos en orden. */
export interface FestivalSpot {
  id: string;
  titulo: string;
  descripcion: string;
  fotos: string[];
  orden: number;
  activo: boolean;
}

/** Una pregunta de /blur/info. */
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
  locacion_fotos: [],
  home_fotos: [],
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
  lineup_visible: true,
  pago_mercadopago: true,
  pago_transferencia: true,
  pago_cripto: false,
};
