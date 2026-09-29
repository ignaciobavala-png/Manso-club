import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { createSupabaseServer } from '@/lib/supabase';
import {
  CONFIG_FESTIVAL_VACIA,
  FestivalConfig,
  FestivalEntrada,
  FestivalEscenario,
} from '@/lib/types/festival';
import { FestivalPagina } from '@/components/festival/FestivalPagina';

/**
 * /festival — venta de entradas con identidad propia (sin navbar de Manso:
 * ver `ChromeManso`).
 *
 * No hay chequeo de rol acá: lo hace el RLS. Mientras el festival no esté
 * publicado, `festival_config` solo se deja leer por un admin, así que para
 * cualquier otro la consulta vuelve vacía y la página da 404. Por eso se usa el
 * cliente con cookies y no el anónimo.
 */
// `cache`: generateMetadata y la página comparten la misma lectura.
const leerConfig = cache(async () => {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from('festival_config').select('*').eq('id', 1).maybeSingle();
  return { supabase, config: data as FestivalConfig | null };
});

export async function generateMetadata(): Promise<Metadata> {
  const { config } = await leerConfig();
  return {
    title: config?.nombre ?? 'Festival',
    description: config?.bajada ?? undefined,
    // Aunque se publique, no se indexa hasta que se decida lanzarlo en serio.
    robots: { index: false, follow: false },
  };
}

export default async function FestivalPage() {
  const { supabase, config } = await leerConfig();
  if (!config) notFound();

  const [escenarios, entradas] = await Promise.all([
    supabase
      .from('festival_escenarios')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true }),
    supabase
      .from('festival_entradas')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true }),
  ]);

  return (
    <FestivalPagina
      config={{ ...CONFIG_FESTIVAL_VACIA, ...config }}
      escenarios={(escenarios.data as FestivalEscenario[] | null) ?? []}
      entradas={((entradas.data as FestivalEntrada[] | null) ?? []).map(e => ({
        ...e,
        precio: Number(e.precio),
      }))}
      // Si se pudo leer sin estar publicado, quien mira es admin.
      borrador={!config.publicado}
    />
  );
}
