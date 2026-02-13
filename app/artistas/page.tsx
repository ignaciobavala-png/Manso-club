import { AdaptiveSectionLayout } from '@/components/ui/AdaptiveSectionLayout';
import { supabase } from '@/lib/supabase';
import { ArtistasClient } from './ArtistasClient';

export default async function ArtistasPage() {
  const { data: artistas } = await supabase
    .from('artistas')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });

  return <ArtistasClient artistas={artistas || []} />;
}
