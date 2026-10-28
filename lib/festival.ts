import { cache } from 'react';
import { createSupabaseServer } from '@/lib/supabase';
import {
  CONFIG_FESTIVAL_VACIA,
  FestivalArtista,
  FestivalConfig,
  FestivalEntrada,
  FestivalEscenario,
  FestivalFaq,
  FestivalSpot,
} from '@/lib/types/festival';
import { enIdioma } from '@/lib/festival-idioma';
import { leerIdioma } from '@/lib/festival-idioma-servidor';
import { comoEntrada, tiposGestion, ventaEnGestion } from '@/lib/gestion-entradas';

/**
 * Lecturas de /blur. Todas con el cliente con cookies y no el anónimo: el
 * RLS es lo que esconde el festival mientras no esté publicado (para cualquiera
 * que no sea admin las tablas vuelven vacías), así que no hay chequeo de rol acá.
 *
 * `cache` deja que el layout, `generateMetadata` y la página compartan una
 * misma lectura por request.
 */

/** `null` = no publicado y quien mira no es admin → la página da 404. */
export const leerConfig = cache(async (): Promise<FestivalConfig | null> => {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from('festival_config').select('*').eq('id', 1).maybeSingle();
  if (!data) return null;
  const config = { ...CONFIG_FESTIVAL_VACIA, ...(data as FestivalConfig) };
  return enIdioma(config, await leerIdioma(), ['bajada', 'aviso', 'lema', 'vision']);
});

export interface EscenarioConArtistas extends FestivalEscenario {
  artistas: FestivalArtista[];
}

/**
 * Escenarios visibles con sus artistas visibles, en orden. Sin artistas, el
 * escenario no aparece. Con el line-up apagado en el panel vuelve vacío: la
 * página dice "se anuncia pronto" y la de cada artista da 404.
 */
export const leerLineup = cache(async (): Promise<EscenarioConArtistas[]> => {
  const config = await leerConfig();
  if (!config?.lineup_visible) return [];
  const supabase = await createSupabaseServer();
  const [escenarios, artistas] = await Promise.all([
    supabase.from('festival_escenarios').select('id, nombre, orden, activo').eq('activo', true).order('orden'),
    supabase.from('festival_artistas').select('*').eq('activo', true).order('orden'),
  ]);

  const idioma = await leerIdioma();
  const todos = ((artistas.data as FestivalArtista[] | null) ?? []).map(a =>
    enIdioma(a, idioma, ['origen', 'bio', 'dia'])
  );
  return ((escenarios.data as FestivalEscenario[] | null) ?? [])
    .map(e => ({ ...e, artistas: todos.filter(a => a.escenario_id === e.id) }))
    .filter(e => e.artistas.length > 0);
});

/**
 * La tabla de venta. Conectada a Manso Gestión, los tipos, precios y lo que
 * queda salen de allá (ver `lib/gestion-entradas`); si Gestión no responde,
 * la tabla queda vacía ("se anuncian pronto") antes que vender a ciegas.
 */
export const leerEntradas = cache(async (): Promise<FestivalEntrada[]> => {
  if (ventaEnGestion()) {
    try {
      return (await tiposGestion()).map(comoEntrada);
    } catch (e) {
      console.error('No se pudieron leer los tipos de entrada de Gestión:', e);
      return [];
    }
  }
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from('festival_entradas').select('*').eq('activo', true).order('orden');
  return ((data as FestivalEntrada[] | null) ?? []).map(e => ({ ...e, precio: Number(e.precio) }));
});

export const leerFaq = cache(async (): Promise<FestivalFaq[]> => {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from('festival_faq').select('*').eq('activo', true).order('orden');
  const idioma = await leerIdioma();
  return ((data as FestivalFaq[] | null) ?? []).map(p => enIdioma(p, idioma, ['titulo', 'texto']));
});

/** Spots visibles, en orden. */
export const leerSpots = cache(async (): Promise<FestivalSpot[]> => {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from('festival_spots').select('*').eq('activo', true).order('orden');
  const idioma = await leerIdioma();
  return ((data as FestivalSpot[] | null) ?? []).map(s => enIdioma(s, idioma, ['titulo', 'descripcion']));
});

/** `2026-12-11` → `11.12.2026`, sin pasar por Date para no correr el día por zona horaria. */
export const fechaCorta = (iso: string | null) => {
  if (!iso) return null;
  const [a, m, d] = iso.split('-');
  return a && m && d ? `${d}.${m}.${a}` : null;
};
