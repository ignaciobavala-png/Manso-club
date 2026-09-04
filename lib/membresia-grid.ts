/**
 * Ancho y columnas de la grilla de cards según cuántas hay en la categoría.
 *
 * Tailwind no puede generar clases dinámicas (`sm:grid-cols-${n}` no existe en
 * el CSS final), así que las combinaciones van escritas a mano. Con 4 cards
 * —Cowork desde que entró Cultural Manso— la fila tiene que seguir siendo una
 * sola en desktop, y para eso también hay que ensanchar el contenedor.
 */
export const gridMembresias = (cantidad: number): string => {
  switch (cantidad) {
    case 1:
      return 'sm:max-w-xs sm:grid-cols-1';
    case 2:
      return 'sm:max-w-2xl sm:grid-cols-2';
    case 4:
      return 'sm:max-w-2xl sm:grid-cols-2 lg:max-w-7xl lg:grid-cols-4';
    default:
      return 'sm:max-w-5xl sm:grid-cols-3';
  }
};
