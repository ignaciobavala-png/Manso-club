/**
 * Vynil — la playlist general de Manso.
 *
 * No hay lista por persona: es una sola, común, que crece con lo que va
 * dejando la gente (tabla `vynil_temas`). Lo que uno pega lo escucha el que
 * entra después, así que la fuente de verdad es la base y no el navegador.
 *
 * Acepta YouTube y SoundCloud: el player de la casa ya reproducía SoundCloud,
 * así que sumar YouTube fue ampliar lo que había.
 */

export type FuenteVynil = 'youtube' | 'soundcloud';

export interface TemaVynil {
  /** Id de la fila; falta solo en el tema recién parseado, antes de guardarlo. */
  id?: string;
  fuente: FuenteVynil;
  /** Id de YouTube (11 chars) o path de SoundCloud ("artista/track"). */
  ref: string;
  titulo?: string;
  autor?: string;
  thumb?: string;
  /** Nombre de quien lo puso, si estaba logueado. */
  puestoPor?: string;
}

const RE_YOUTUBE = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([A-Za-z0-9_-]{11})/;
const RE_SOUNDCLOUD = /soundcloud\.com\/([A-Za-z0-9_-]+\/[A-Za-z0-9_-]+)/;

/** Reconoce el link pegado. Devuelve null si no es de ninguna de las dos. */
export function parsearLink(url: string): TemaVynil | null {
  const limpio = url.trim();
  if (!limpio) return null;

  const yt = limpio.match(RE_YOUTUBE);
  if (yt) return { fuente: 'youtube', ref: yt[1] };

  const sc = limpio.match(RE_SOUNDCLOUD);
  if (sc) return { fuente: 'soundcloud', ref: sc[1] };

  return null;
}

export function urlDeTema(tema: TemaVynil): string {
  return tema.fuente === 'youtube'
    ? `https://www.youtube.com/watch?v=${tema.ref}`
    : `https://soundcloud.com/${tema.ref}`;
}

export function thumbDeTema(tema: TemaVynil): string | null {
  // SoundCloud no expone la portada por URL: hay que pedirla al oEmbed.
  return tema.fuente === 'youtube'
    ? `https://img.youtube.com/vi/${tema.ref}/mqdefault.jpg`
    : tema.thumb ?? null;
}

/**
 * Título y autor del tema. YouTube tiene oEmbed público con CORS abierto;
 * SoundCloud también. Si falla, se devuelve vacío y la UI muestra el link
 * pelado — no vale romper la carga por no haber conseguido el título.
 */
export async function buscarMetadata(tema: TemaVynil): Promise<Partial<TemaVynil>> {
  const endpoint =
    tema.fuente === 'youtube'
      ? `https://www.youtube.com/oembed?url=${encodeURIComponent(urlDeTema(tema))}&format=json`
      : `https://soundcloud.com/oembed?url=${encodeURIComponent(urlDeTema(tema))}&format=json`;

  try {
    const r = await fetch(endpoint);
    if (!r.ok) return {};
    const d = await r.json();
    return {
      titulo: d.title as string | undefined,
      autor: d.author_name as string | undefined,
      thumb: tema.fuente === 'soundcloud' ? (d.thumbnail_url as string | undefined) : undefined,
    };
  } catch {
    return {};
  }
}
