import { createSupabaseServer } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { AdaptiveSectionLayout } from '@/components/ui/AdaptiveSectionLayout';
import { ParticleBackground } from '@/components/Home/ParticleBackground';
import StreamingLibrary from './StreamingLibrary';

export const metadata = {
  title: 'Streaming | Manso Club',
};

export default async function StreamingPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?from=/streaming');

  const [{ data: contenido }, { data: categorias }] = await Promise.all([
    supabase
      .from('streaming_contenido')
      .select('id, titulo, slug, descripcion, tipo, thumbnail_url, is_live, scheduled_at, duracion_minutos, precio_individual, curso_id, orden')
      .eq('activo', true)
      .order('orden', { ascending: true }),
    supabase
      .from('streaming_categorias')
      .select('slug, nombre, color')
      .order('orden', { ascending: true }),
  ]);

  return (
    <div className="relative min-h-screen bg-manso-black">
      <ParticleBackground />
      <AdaptiveSectionLayout
        title="Streaming"
        subtitle="Contenido exclusivo_"
        customBg="bg-transparent"
      >
        <StreamingLibrary
          contenido={contenido ?? []}
          tieneMembresia={true}
          compraIds={[]}
          categorias={categorias ?? []}
        />
      </AdaptiveSectionLayout>
    </div>
  );
}
