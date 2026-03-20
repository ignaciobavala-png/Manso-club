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
  const supabase = createSupabaseAnon();
  const { data: artistas } = await supabase
    .from('artistas')
    .select('id, nombre, slug, bio, estilo, imagen_url, soundcloud_url, social_links, active, tipo')
    .eq('active', true)
    .order('nombre', { ascending: true });

  return <ArtistasClient artistas={artistas || []} />;
}
