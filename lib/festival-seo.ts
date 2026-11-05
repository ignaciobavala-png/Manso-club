import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';
import { ORG_ID, descripcion, og } from '@/lib/seo';
import type { FestivalConfig } from '@/lib/types/festival';

/**
 * SEO de /blur. El nombre que se busca es BLUR; `config.nombre` ("Subreal") es
 * el de la pestaña y el pie, así que el título los junta.
 */
export const MARCA_SEO = 'BLUR';

/** Imagen al compartir: el banner del panel o la foto del hero por defecto. 1200×630 no hay: va tal cual. */
const IMAGEN_POR_DEFECTO = '/blur/hero-cabina.jpg';

const FECHA_LARGA = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** "15 de noviembre de 2026", o null si no hay fecha cargada. */
export function fechaLarga(iso: string | null): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  return FECHA_LARGA.format(new Date(`${iso}T00:00:00Z`));
}

/** "BLUR · Subreal — 15 de noviembre de 2026, Lugar": la frase que Google muestra de snippet. */
export function resumenFestival(config: FestivalConfig): string {
  const cuando = fechaLarga(config.fecha);
  const donde = [config.lugar, config.direccion].filter(Boolean).join(', ');
  return [cuando, donde].filter(Boolean).join(' · ');
}

/** Metadata base del festival, con Open Graph propio (no el de Manso). */
export function metadataFestival(config: FestivalConfig | null): Metadata {
  const nombre = config?.nombre ?? 'Festival';
  const titulo = `${MARCA_SEO} · ${nombre}`;
  const resumen = config ? resumenFestival(config) : '';
  const desc = descripcion([config?.bajada, resumen].filter(Boolean).join(' — ')) ?? `${MARCA_SEO}, festival de Manso Club en Buenos Aires.`;
  const imagen = config?.banner_url || IMAGEN_POR_DEFECTO;

  return {
    title: { default: titulo, template: `%s — ${MARCA_SEO}` },
    description: desc,
    // Se indexa solo publicado: antes de eso el RLS ya da 404, esto es el cinturón.
    robots: config?.publicado ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: og({
      title: titulo,
      description: desc,
      images: [{ url: imagen, alt: `${MARCA_SEO} — ${nombre}` }],
    }),
    twitter: { card: 'summary_large_image', title: titulo, description: desc, images: [imagen] },
  };
}

/** Event de schema.org para la home de /blur. Null si no hay fecha o ya pasó. */
export function eventoFestival(config: FestivalConfig, artistas: { nombre: string }[]) {
  if (!config.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(config.fecha)) return null;
  // La fecha es de calendario argentino, sin hora: se compara con hoy en Buenos Aires.
  const hoy = new Date(Date.now() - 3 * 3_600_000).toISOString().slice(0, 10);
  if (config.fecha < hoy) return null;

  const imagen = config.banner_url || `${SITE_URL}${IMAGEN_POR_DEFECTO}`;
  return {
    '@type': 'MusicEvent',
    name: `${MARCA_SEO} · ${config.nombre}`,
    url: `${SITE_URL}/blur`,
    ...(descripcion(config.bajada, 500) && { description: descripcion(config.bajada, 500) }),
    startDate: config.fecha,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: [imagen],
    location: {
      '@type': 'Place',
      name: config.lugar ?? config.nombre,
      address: {
        '@type': 'PostalAddress',
        ...(config.direccion && { streetAddress: config.direccion }),
        addressLocality: 'Buenos Aires',
        addressCountry: 'AR',
      },
    },
    organizer: { '@id': ORG_ID },
    ...(artistas.length > 0 && { performer: artistas.map(a => ({ '@type': 'PerformingGroup', name: a.nombre })) }),
    offers: {
      '@type': 'AggregateOffer',
      url: `${SITE_URL}/blur/tickets`,
      priceCurrency: 'ARS',
      availability: 'https://schema.org/InStock',
    },
  };
}
