import type { Metadata } from 'next';
import { ArtistasClient } from './ArtistasClient';
import { createSupabaseAnon } from '@/lib/supabase';

export const revalidate = 30;

export const metadata: Metadata = {
  title: 'Artistas | Manso Club',
  description:
    'Conocé a los DJs y artistas residentes de Manso Club. Techno, House, Minimal y más en Buenos Aires.',
  openGraph: {
    title: 'Artistas | Manso Club',
    description:
      'Conocé a los DJs y artistas residentes de Manso Club.',
    type: 'website',
  },
};

export default async function ArtistasPage() {
  try {
    const supabase = createSupabaseAnon();
    const { data: artistas } = await supabase
      .from('artistas')
      .select('id, nombre, slug, bio, estilo, imagen_url, soundcloud_url, social_links, active, tipo')
      .eq('active', true)
      .order('nombre', { ascending: true });

    const visuales = (artistas || []).filter(a => a.tipo === 'Artista Visual');
    const visualIds = visuales.map(a => a.id);

    let obrasVisuales: { id: string; src: string; artistaSlug: string }[] = [];
    if (visualIds.length > 0) {
      const { data: fotos } = await supabase
        .from('artista_fotos')
        .select('id, url, artista_id, orden')
        .in('artista_id', visualIds)
        .order('orden', { ascending: true });

      obrasVisuales = (fotos || []).map(f => ({
        id: f.id,
        src: f.url,
        artistaSlug: visuales.find(a => a.id === f.artista_id)?.slug || '',
      }));
    }

    return <ArtistasClient artistas={artistas || []} obrasVisuales={obrasVisuales} />;
  } catch {
    return <ArtistasClient artistas={[]} obrasVisuales={[]} />;
  }
}
