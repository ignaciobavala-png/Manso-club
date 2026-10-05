export const WHATSAPP_NUMBER = "5491130232533";

// Dominio oficial para canonical, sitemap, Open Graph y schema. Va fijo y no
// sale de NEXT_PUBLIC_SITE_URL para que un preview nunca se declare canónico.
// (manso.club figuraba acá pero nunca fue nuestro: da 404.)
export const SITE_URL = "https://mansoclub.com.ar";

export const CATEGORIAS_TIENDA = [
  'Vinilos',
  'Art & Home',
  'Fashion',
  'Books',
  'Manso Club Special',
] as const;

export type Categoria = typeof CATEGORIAS_TIENDA[number];
