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

  // Fetch contenido activo
  const { data: contenido } = await supabase
    .from('streaming_contenido')
    .select('id, titulo, slug, descripcion, tipo, thumbnail_url, is_live, scheduled_at, duracion_minutos, precio_individual, curso_id, orden')
    .eq('activo', true)
    .order('orden', { ascending: true });

  // Verificar si tiene membresía con streaming
  const { data: membresia } = await supabase
    .from('user_membresias_activas')
    .select('id, membresias(incluye_streaming, nombre)')
    .eq('user_id', user.id)
    .eq('estado', 'activa')
    .gt('vencimiento', new Date().toISOString())
    .maybeSingle();

  const membresiaData = membresia?.membresias as { incluye_streaming: boolean; nombre: string } | null | undefined;
  const tieneMembresia = !!(Array.isArray(membresiaData) ? membresiaData[0] : membresiaData)?.incluye_streaming;

  // Compras individuales del usuario
  const { data: compras } = await supabase
    .from('streaming_compras')
    .select('contenido_id')
    .eq('user_id', user.id);

  const compraIds = new Set((compras ?? []).map(c => c.contenido_id));

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
          tieneMembresia={tieneMembresia}
          compraIds={Array.from(compraIds)}
        />
      </AdaptiveSectionLayout>
    </div>
  );
}
