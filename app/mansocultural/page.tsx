import type { Metadata } from 'next';
import { createSupabaseAnon } from '@/lib/supabase';
import { CulturaBanner, CulturaBloque, CulturaConfig } from '@/lib/types/cultura';
import { CulturaPagina } from '@/components/cultura/CulturaPagina';

export const dynamic = 'force-dynamic';

// Ruta suelta: todavía no la linkea nadie y no queremos que la indexen hasta
// que Ana la dé por lista.
export const metadata: Metadata = {
  title: 'Cultural Manso',
  robots: { index: false, follow: false },
};

export default async function MansoCulturalPage() {
  const supabase = createSupabaseAnon();

  const [config, banners, bloques] = await Promise.all([
    supabase.from('cultura_config').select('*').eq('id', 1).maybeSingle(),
    supabase
      .from('cultura_banners')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true }),
    supabase
      .from('cultura_bloques')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true }),
  ]);

  const cfg = config.data as CulturaConfig | null;

  return (
    <CulturaPagina
      titulo={cfg?.titulo || 'Cultural Manso'}
      intro={cfg?.intro}
      banners={(banners.data as CulturaBanner[] | null) ?? []}
      bloques={(bloques.data as CulturaBloque[] | null) ?? []}
    />
  );
}
