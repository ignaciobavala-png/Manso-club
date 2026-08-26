/**
 * Vynil — la playlist que el visitante arma para recorrer Manso.
 *
 * Acepta links de YouTube y de SoundCloud: el player global ya reproduce
 * SoundCloud, así que sumar YouTube es ampliar lo que hay, no reemplazarlo.
 *
 * Con 5 temas la lista entra holgada en una URL (un id de YouTube son 11
 * caracteres), así que compartir no necesita base de datos: el mix viaja en el
 * link y el propio vive en localStorage. La tabla existe solo para que Ana
 * pueda escuchar lo que deja la gente.
 */

export const VYNIL_MAX_TEMAS = 5;
export const VYNIL_PARAM = 'mix';

export type FuenteVynil = 'youtube' | 'soundcloud';

export interface TemaVynil {
  fuente: FuenteVynil;
  /** Id de YouTube (11 chars) o path de SoundCloud ("artista/track"). */
  ref: string;
  titulo?: string;
  autor?: string;
  thumb?: string;
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
 * Serializa el mix para la URL. YouTube va como `y:<id>` y SoundCloud como
 * `s:<path>`, separados por coma. Cinco temas quedan en ~70 caracteres.
 */
export function codificarMix(temas: TemaVynil[]): string {
  return temas
    .slice(0, VYNIL_MAX_TEMAS)
    .map(t => `${t.fuente === 'youtube' ? 'y' : 's'}:${t.ref}`)
    .join(',');
}

export function decodificarMix(valor: string | null): TemaVynil[] {
  if (!valor) return [];
  return valor
    .split(',')
    .map((parte): TemaVynil | null => {
      const [tipo, ...resto] = parte.split(':');
      const ref = resto.join(':');
      if (!ref) return null;
      if (tipo === 'y' && /^[A-Za-z0-9_-]{11}$/.test(ref)) return { fuente: 'youtube', ref };
      if (tipo === 's' && /^[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/.test(ref)) return { fuente: 'soundcloud', ref };
      return null;
    })
    .filter((t): t is TemaVynil => t !== null)
    .slice(0, VYNIL_MAX_TEMAS);
}

/** Link para compartir: cae en la home con el mix puesto y listo para sonar. */
export function linkDeMix(temas: TemaVynil[], origen: string): string {
  return `${origen}/?${VYNIL_PARAM}=${encodeURIComponent(codificarMix(temas))}`;
}

/**
 * Título y autor del tema. YouTube tiene oEmbed público con CORS abierto;
 * SoundCloud también. Si falla, se devuelve null y la UI muestra el link pelado
 * — no vale romper la carga por no haber conseguido el título.
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
