import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';
import { ORG_ID, descripcion, og } from '@/lib/seo';
import type { FestivalConfig, FestivalEntrada } from '@/lib/types/festival';

/**
 * SEO de /blurfestival. El nombre que se busca es BLUR; `config.nombre` ("Subreal") es
 * el de la pestaña y el pie, así que el título los junta.
 */
export const MARCA_SEO = 'BLUR';

/** Foto del hero por defecto, si el panel no tiene ni flyer ni banner. */
export const IMAGEN_POR_DEFECTO = '/blurfestival/hero-cabina.jpg';

/**
 * Imagen al compartir. Con flyer cargado en el panel la arma `/blurfestival/og` (el
 * flyer entero en 1200×630: WhatsApp recorta lo vertical). El `v` es el nombre
 * del archivo: al cambiar el flyer cambia la URL y WhatsApp vuelve a bajarla
 * en vez de mostrar la vieja cacheada. Sin flyer: el banner, o la foto por defecto.
 */
function imagenAlCompartir(config: FestivalConfig | null) {
  if (config?.flyer_url) {
    const version = encodeURIComponent(config.flyer_url.split('/').pop() ?? '');
    return { url: `/blurfestival/og?v=${version}`, width: 1200, height: 630 };
  }
  return { url: config?.banner_url || IMAGEN_POR_DEFECTO };
}

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

/** "BLUR · Subreal"; con el nombre vacío en el panel, solo "BLUR" (sin el separador colgando). */
function tituloFestival(nombre: string | null | undefined): string {
  const n = nombre?.trim();
  return n ? `${MARCA_SEO} · ${n}` : MARCA_SEO;
}

/**
 * "BLUR" solo es una palabra común (desenfoque, la banda): nadie lo va a
 * encontrar buscando eso. El título que ve Google suma lo que la gente sí
 * escribe: "festival", el año y el lugar. → "BLUR Festival 2026 · Delta, Tigre".
 * Sin fecha o lugar cargados, se omite lo que falte.
 */
export function tituloBusqueda(config: FestivalConfig | null): string {
  const anio = config?.fecha?.slice(0, 4);
  const base = [`${MARCA_SEO} Festival`, anio].filter(Boolean).join(' ');
  const lugar = config?.lugar?.trim();
  return lugar ? `${base} · ${lugar}` : base;
}

/** Palabras que acompañan a la marca en el texto que lee Google. */
export const PALABRAS_CLAVE = [
  'BLUR Festival',
  'festival de música electrónica',
  'festival en el Delta de Tigre',
  'festival Buenos Aires',
  'Manso Club',
  'entradas BLUR',
  'line up BLUR',
];

/** Horario libre del panel ("14 a 04am", "14 a 4", "15hs a 03hs") → horas de inicio y fin. */
function horasDelHorario(horario: string | null): { ini: number; fin: number } | null {
  const m = horario?.match(/(\d{1,2})\s*(?:hs?|h)?\s*(?:a|-|–|hasta)\s*(\d{1,2})/i);
  if (!m) return null;
  const ini = Number(m[1]);
  const fin = Number(m[2]);
  return ini < 24 && fin < 24 ? { ini, fin } : null;
}

const dosDigitos = (n: number) => String(n).padStart(2, '0');

/**
 * startDate/endDate de schema.org con hora y zona (Argentina es -03:00 todo el
 * año). Si el horario termina antes de empezar (14 a 04) el fin cae al día
 * siguiente. Sin horario legible, queda solo la fecha, que también es válida.
 */
function fechasEvento(config: FestivalConfig): { startDate: string; endDate?: string } {
  const dia = config.fecha as string;
  const h = horasDelHorario(config.horario);
  if (!h) return { startDate: dia };
  const fin = new Date(`${dia}T00:00:00Z`);
  if (h.fin <= h.ini) fin.setUTCDate(fin.getUTCDate() + 1);
  return {
    startDate: `${dia}T${dosDigitos(h.ini)}:00:00-03:00`,
    endDate: `${fin.toISOString().slice(0, 10)}T${dosDigitos(h.fin)}:00:00-03:00`,
  };
}

/** Metadata base del festival, con Open Graph propio (no el de Manso). */
export function metadataFestival(config: FestivalConfig | null): Metadata {
  const titulo = tituloBusqueda(config);
  const resumen = config ? resumenFestival(config) : '';
  // La frase con las palabras clave va primero (es lo que Google muestra); la
  // bajada del panel, que es copy de marca, completa si queda lugar.
  const intro = `${MARCA_SEO} Festival: música electrónica en vivo en Manso Club, Buenos Aires`;
  const desc =
    descripcion([intro, resumen, config?.bajada].filter(Boolean).join(' — ')) ??
    `${MARCA_SEO} Festival, el festival de música electrónica de Manso Club en Buenos Aires.`;
  const imagen = imagenAlCompartir(config);

  return {
    title: { default: titulo, template: `%s — ${MARCA_SEO} Festival` },
    description: desc,
    keywords: PALABRAS_CLAVE,
    applicationName: `${MARCA_SEO} Festival`,
    // Se indexa solo publicado: antes de eso el RLS ya da 404, esto es el cinturón.
    robots: config?.publicado ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: og({
      title: titulo,
      description: desc,
      images: [{ ...imagen, alt: titulo }],
    }),
    twitter: { card: 'summary_large_image', title: titulo, description: desc, images: [imagen.url] },
  };
}

/** Event de schema.org para la home de /blurfestival. Null si no hay fecha o ya pasó. */
export function eventoFestival(config: FestivalConfig, artistas: { nombre: string }[], entradas: FestivalEntrada[] = []) {
  if (!config.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(config.fecha)) return null;
  // La fecha es de calendario argentino, sin hora: se compara con hoy en Buenos Aires.
  const hoy = new Date(Date.now() - 3 * 3_600_000).toISOString().slice(0, 10);
  if (config.fecha < hoy) return null;

  const imagenes = [config.flyer_url, config.banner_url, `${SITE_URL}${IMAGEN_POR_DEFECTO}`].filter(
    (u, i, todas): u is string => !!u && todas.indexOf(u) === i,
  );
  // Precio más bajo entre las entradas que se pueden comprar hoy (el pack no
  // cuenta por unidad: su precio es el del pack entero).
  const precios = entradas.filter(e => e.estado === 'en_venta' && e.precio > 0).map(e => e.precio);
  const enVenta = entradas.some(e => e.estado === 'en_venta');
  const agotado = entradas.length > 0 && entradas.every(e => e.estado === 'agotado');
  const intro = `${MARCA_SEO} Festival: música electrónica en vivo en Manso Club, ${config.lugar ?? 'Buenos Aires'}`;
  return {
    '@type': 'MusicEvent',
    '@id': `${SITE_URL}/blurfestival#evento`,
    name: tituloBusqueda(config),
    url: `${SITE_URL}/blurfestival`,
    inLanguage: 'es-AR',
    description: descripcion([intro, config.bajada].filter(Boolean).join('. '), 500),
    ...fechasEvento(config),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: imagenes,
    location: {
      '@type': 'Place',
      name: config.lugar ?? config.nombre,
      address: {
        '@type': 'PostalAddress',
        // `direccion` en el panel suele ser solo la provincia ("Buenos Aires"):
        // como calle no sirve. La localidad es la primera parte de `lugar`
        // ("Delta, Tigre" → Tigre) y la provincia, lo que quede.
        ...(config.direccion && !/^buenos aires$/i.test(config.direccion.trim()) && { streetAddress: config.direccion }),
        addressLocality: config.lugar?.split(',').pop()?.trim() || 'Buenos Aires',
        addressRegion: 'Buenos Aires',
        addressCountry: 'AR',
      },
    },
    organizer: { '@id': ORG_ID },
    ...(artistas.length > 0 && { performer: artistas.map(a => ({ '@type': 'PerformingGroup', name: a.nombre })) }),
    offers: {
      '@type': 'AggregateOffer',
      url: `${SITE_URL}/blurfestival/tickets`,
      priceCurrency: 'ARS',
      ...(precios.length > 0 && { lowPrice: Math.min(...precios), highPrice: Math.max(...precios), offerCount: precios.length }),
      availability: agotado
        ? 'https://schema.org/SoldOut'
        : enVenta || entradas.length === 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/PreOrder',
    },
  };
}
