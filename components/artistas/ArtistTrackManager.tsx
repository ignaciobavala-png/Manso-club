'use client';

import { useArtistTrack } from '@/hooks/useArtistTrack';

interface Artist {
  nombre: string;
  soundcloud_url?: string;
  social_links?: {
    soundcloud?: string;
  };
}

interface ArtistTrackManagerProps {
  artist: Artist;
}

export function ArtistTrackManager({ artist }: ArtistTrackManagerProps) {
  useArtistTrack(artist);
  
  // Este componente no renderiza nada, solo maneja el estado
  return null;
}
