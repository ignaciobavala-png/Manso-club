import { createSupabaseServer } from '@/lib/supabase';
import { AdaptiveSectionLayout } from '@/components/ui/AdaptiveSectionLayout';
import { ParticleBackground } from '@/components/Home/ParticleBackground';
import StreamingLibrary from './StreamingLibrary';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Streaming | Manso Club',
};

type Nivel = 'publico' | 'registrado' | 'miembro';
const NIVELES_VISIBLES: Record<Nivel, string[]> = {
  publico:    ['publico'],
  registrado: ['publico', 'registrado'],
  miembro:    ['publico', 'registrado', 'miembro'],
};

export default async function StreamingPage() {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();

  let nivel: Nivel = 'publico';
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('membresia_activa, membresia_hasta')
      .eq('id', user.id)
      .single();

    if (
      profile?.membresia_activa &&
      (!profile.membresia_hasta || new Date(profile.membresia_hasta) > new Date())
    ) {
      nivel = 'miembro';
    } else {
      nivel = 'registrado';
    }
  }

  const nivelesVisibles = NIVELES_VISIBLES[nivel];

  const [{ data: contenido }, { data: categorias }, { data: canalConfig }] = await Promise.all([
    supabase
      .from('streaming_contenido')
      .select('id, titulo, slug, descripcion, tipo, thumbnail_url, is_live, scheduled_at, duracion_minutos, curso_id, orden, visibilidad')
      .eq('activo', true)
      .in('visibilidad', nivelesVisibles)
      .order('orden', { ascending: true }),
    supabase
      .from('streaming_categorias')
      .select('slug, nombre, color')
      .order('orden', { ascending: true }),
    supabase
      .from('streaming_config')
      .select('modo, stream_url, contenido_id')
      .single(),
  ]);

  // Para el canal en modo 'grabado', necesitamos el contenido seleccionado
  let canalContenido = null;
  if (canalConfig?.modo === 'grabado' && canalConfig.contenido_id) {
    const { data } = await supabase
      .from('streaming_contenido')
      .select('id, titulo, youtube_video_id, thumbnail_url')
      .eq('id', canalConfig.contenido_id)
      .single();
    canalContenido = data;
  }

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
          categorias={categorias ?? []}
          nivel={nivel}
          canal={{
            modo: canalConfig?.modo ?? 'apagado',
            streamUrl: canalConfig?.stream_url ?? null,
            contenido: canalContenido,
          }}
        />
      </AdaptiveSectionLayout>
    </div>
  );
}
