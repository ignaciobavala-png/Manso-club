import type { Metadata } from 'next';
import { SITE_URL, WHATSAPP_NUMBER } from './constants';

type OpenGraph = NonNullable<Metadata['openGraph']>;

/** Imagen por defecto al compartir un link (WhatsApp, Instagram, X). 1200×630. */
export const OG_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'Manso Club',
};

/**
 * Open Graph de una página. Next no mezcla el `openGraph` de una página con el
 * del layout: lo reemplaza entero. Sin esto, cada página que definía su título
 * para redes perdía la imagen, el nombre del sitio y la URL.
 */
export function og(o: OpenGraph = {}): OpenGraph {
  return {
    siteName: 'Manso Club',
    locale: 'es_AR',
    type: 'website',
    url: './',
    images: [OG_IMAGE],
    ...o,
  } as OpenGraph;
}

/**
 * Texto de la DB listo para `description`: sin saltos de línea ni espacios
 * dobles, y cortado en ~160 caracteres sin partir palabras (es lo que muestra
 * Google; el resto lo trunca igual).
 */
export function descripcion(texto: string | null | undefined, max = 160): string | undefined {
  // Un salto de línea sin puntuación antes es una lista ("Acceso al cowork\n
  // Descuento…"): se convierte en punto para que no quede una frase corrida.
  const limpio = texto
    ?.trim()
    .replace(/([^.!?:;,])\s*\n+\s*/g, '$1. ')
    .replace(/\s+/g, ' ')
    .replace(/([.!?])(\s*\.)+/g, '$1');
  if (!limpio) return undefined;
  if (limpio.length <= max) return limpio;
  const corte = limpio.slice(0, max - 1);
  return `${corte.slice(0, corte.lastIndexOf(' ')).replace(/[,.;:]$/, '')}…`;
}

/** El lugar físico. Lo usan el schema del layout y llms.txt. */
export const LUGAR = {
  calle: 'Cdad. de la Paz 601',
  codigoPostal: 'C1426',
  barrio: 'Colegiales',
  ciudad: 'Buenos Aires',
  pais: 'AR',
  instagram: 'https://www.instagram.com/manso___club/',
  whatsapp: `+${WHATSAPP_NUMBER}`,
};

export const ORG_ID = `${SITE_URL}/#organization`;
