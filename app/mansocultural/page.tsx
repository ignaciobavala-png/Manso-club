import type { Metadata } from 'next';
import { createSupabaseAnon } from '@/lib/supabase';
import { CulturaBanner, CulturaBloque, CulturaConfig } from '@/lib/types/cultura';
import { CulturaPagina } from '@/components/cultura/CulturaPagina';
import { og } from '@/lib/seo';

export const dynamic = 'force-dynamic';

// Ana la dio por lista: ahora la linkea la card "Cultural Manso" de
// /membresias y la ruta se indexa como cualquier otra.
const titulo = 'Cultural Manso | Manso Club';
const descripcion =
  'La pata cultural de Manso Club en Colegiales: ciclos, muestras, charlas y encuentros que cruzan música, arte, gastronomía y tecnología.';

export const metadata: Metadata = {
  title: titulo,
  description: descripcion,
  openGraph: og({ title: titulo, description: descripcion }),
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
