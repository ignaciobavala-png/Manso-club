/**
 * Ancho y columnas de la grilla de cards según cuántas hay en la categoría.
 *
 * Tailwind no puede generar clases dinámicas (`sm:grid-cols-${n}` no existe en
 * el CSS final), así que las combinaciones van escritas a mano. Con 4 cards
 * —Cowork desde que entró Cultural Manso— la fila tiene que seguir siendo una
 * sola en desktop, y para eso también hay que ensanchar el contenedor.
 *
 * En mobile van de a dos siempre que haya más de una: con cuatro, una sola
 * columna dejaba la grilla larguísima. La card se achica sola para bancarlo
 * (ver los breakpoints base/sm en MembresiaCard).
 */
export const gridMembresias = (cantidad: number): string => {
  switch (cantidad) {
    case 1:
      return 'max-w-sm grid-cols-1 sm:max-w-xs';
    case 2:
      return 'max-w-sm grid-cols-2 sm:max-w-2xl';
    case 4:
      return 'grid-cols-2 sm:max-w-2xl lg:max-w-7xl lg:grid-cols-4';
    default:
      return 'grid-cols-2 sm:max-w-5xl sm:grid-cols-3';
  }
};
