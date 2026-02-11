export const CATEGORIAS_TIENDA = [
  'Vinilos',
  'Art & Home',
  'Fashion',
  'Books',
  'Manso Club Special' // Agregué una extra por si querés probar
] as const;

export type Categoria = typeof CATEGORIAS_TIENDA[number];