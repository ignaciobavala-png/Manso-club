import { createSupabaseServer } from '@/lib/supabase';
import MultimediaClient from './MultimediaClient';

export const dynamic = 'force-dynamic';

export default async function MultimediaPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  // Multimedia pública
  const { data: items } = await supabase
    .from('multimedia_videos')
    .select('id, titulo, youtube_url, archivo_url, descripcion, tipo, orden')
    .eq('active', true)
    .order('orden', { ascending: true });

  // Transmisiones pasadas — solo para usuarios logueados
  let transmisiones: {
    id: string;
    titulo: string;
    slug: string;
    youtube_video_id: string | null;
    thumbnail_url: string | null;
    tipo: string;
    duracion_minutos: number | null;
    transmitido_en: string | null;
  }[] = [];

  if (user) {
    const { data } = await supabase
      .from('streaming_contenido')
      .select('id, titulo, slug, youtube_video_id, thumbnail_url, tipo, duracion_minutos, transmitido_en')
      .eq('fue_transmitido', true)
      .eq('activo', true)
      .order('transmitido_en', { ascending: false });
    transmisiones = data ?? [];
  }

  return (
    <MultimediaClient
      items={items ?? []}
      transmisiones={transmisiones}
      estaLogueado={!!user}
    />
  );
}
