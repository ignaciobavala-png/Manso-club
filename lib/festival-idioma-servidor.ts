import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { COOKIE_IDIOMA, TEXTOS, esIdioma, idiomaDeNavegador, type Idioma } from '@/lib/festival-idioma';

/**
 * El idioma de esta request: la cookie que deja el selector ES/EN y, sin ella,
 * el del navegador (ver `idiomaDeNavegador`). Cacheado por request para que el
 * layout y la página lean una sola vez.
 */
export const leerIdioma = cache(async (): Promise<Idioma> => {
  const guardado = (await cookies()).get(COOKIE_IDIOMA)?.value;
  if (esIdioma(guardado)) return guardado;
  return idiomaDeNavegador((await headers()).get('accept-language'));
});

/** Atajo para las páginas: los textos ya en el idioma que toca. */
export const leerTextos = async () => {
  const idioma = await leerIdioma();
  return { idioma, t: TEXTOS[idioma] };
};
