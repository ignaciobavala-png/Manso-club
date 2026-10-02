import { ColorAcento } from '@/lib/types/membresia';

/**
 * Fondo pleno del detalle (y de la card cultural). Los cuatro tokens de la
 * paleta son oscuros, así que el texto va siempre en manso-cream: no hace falta
 * una variante clara.
 *
 * Las clases van escritas enteras a propósito. Tailwind escanea el código como
 * texto plano: un `bg-manso-${color}` no llegaría al CSS final.
 */
const FONDOS: Record<ColorAcento, string> = {
  terra: 'bg-manso-terra',
  olive: 'bg-manso-olive',
  blue: 'bg-manso-blue',
  brown: 'bg-manso-brown',
};

export const ACENTO_POR_DEFECTO: ColorAcento = 'terra';

export const fondoAcento = (color: ColorAcento | null) =>
  FONDOS[color ?? ACENTO_POR_DEFECTO] ?? FONDOS[ACENTO_POR_DEFECTO];

/**
 * Mismo fondo, pero solo mientras el mouse está sobre el botón SELECCIONAR de
 * la card (marcado con `data-seleccionar`). Va en la propia card con `has-`,
 * así que no hace falta estado de React.
 */
const FONDOS_HOVER_BOTON: Record<ColorAcento, string> = {
  terra: 'has-[[data-seleccionar]:hover]:bg-manso-terra',
  olive: 'has-[[data-seleccionar]:hover]:bg-manso-olive',
  blue: 'has-[[data-seleccionar]:hover]:bg-manso-blue',
  brown: 'has-[[data-seleccionar]:hover]:bg-manso-brown',
};

export const fondoAcentoHoverBoton = (color: ColorAcento | null) =>
  FONDOS_HOVER_BOTON[color ?? ACENTO_POR_DEFECTO] ?? FONDOS_HOVER_BOTON[ACENTO_POR_DEFECTO];
