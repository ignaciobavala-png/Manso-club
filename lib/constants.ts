export const WHATSAPP_NUMBER = "5491130232533";

export const CATEGORIAS_TIENDA = [
  'Vinilos',
  'Art & Home',
  'Fashion',
  'Books',
  'Manso Club Special',
] as const;

export type Categoria = typeof CATEGORIAS_TIENDA[number];
