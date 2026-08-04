/**
 * Helpers de color compartidos entre el template del mail
 * (emails/campania-generica.tsx) y el editor del admin.
 *
 * Viven acá y no en el template porque el editor es un componente cliente:
 * importar el template para reusar la función arrastraría react-email entero
 * al bundle del navegador. Y no se duplican porque cada copia que se desfasa
 * hace que la vista previa muestre un color distinto al que se manda.
 */

/** Luminancia percibida: decide si el texto sobre este fondo va claro u oscuro. */
export function esFondoOscuro(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
}

/** Color de texto que el mail usa sobre `fondo` cuando no se eligió uno. */
export const colorTextoAuto = (fondo: string): string =>
  esFondoOscuro(fondo) ? '#FFFCDC' : '#1D1D1B';
