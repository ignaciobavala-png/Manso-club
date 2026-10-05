import type { Metadata } from 'next';
import { createSupabaseAnon } from '@/lib/supabase';
import { EspacioConfig, EspacioSala } from '@/lib/types/espacio';
import { EspacioPagina } from '@/components/espacio/EspacioPagina';
import { og } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const titulo = 'Nuestro espacio | Manso Club';
const descripcion =
  'Las salas de Manso Club en Colegiales, Buenos Aires: cowork, terraza y espacio para eventos, talleres y encuentros.';

export const metadata: Metadata = {
  title: titulo,
  description: descripcion,
  openGraph: og({ title: titulo, description: descripcion }),
};

export default async function NuestroEspacioPage() {
  const supabase = createSupabaseAnon();

  const [config, salas] = await Promise.all([
    supabase.from('espacio_config').select('*').eq('id', 1).maybeSingle(),
    supabase
      .from('espacio_salas')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true }),
  ]);

  const cfg = config.data as EspacioConfig | null;

  return (
    <EspacioPagina
      titulo={cfg?.titulo || 'Nuestro espacio'}
      intro={cfg?.intro}
      salas={(salas.data as EspacioSala[] | null) ?? []}
    />
  );
}
