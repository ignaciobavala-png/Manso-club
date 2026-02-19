'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { HomeMusicPlayer } from '@/components/Home/HomeMusicPlayer';

interface Track {
  id: string;
  titulo: string;
  artista: string;
  soundcloud_url: string;
}

interface ArtistOverride {
  artistName: string;
  soundcloud_url: string;
}

export function GlobalMusicPlayer() {
  const [mainTracks, setMainTracks] = useState<Track[]>([]);
  const [artistOverride, setArtistOverride] = useState<ArtistOverride | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Fetch main_music tracks on mount
  useEffect(() => {
    const fetchTracks = async () => {
      const { data } = await supabase
        .from('main_music')
        .select('id, titulo, artista, soundcloud_url')
        .eq('active', true)
        .order('orden', { ascending: true });

      if (data && data.length > 0) {
        setMainTracks(data);
      }
      setLoaded(true);
    };

    fetchTracks();
  }, []);

  // Listen for artist page override events
  useEffect(() => {
    const handleArtistPlay = (e: CustomEvent<ArtistOverride>) => {
      setArtistOverride(e.detail);
    };

    const handleArtistClear = () => {
      setArtistOverride(null);
    };

    window.addEventListener('globalPlayer:artistOverride', handleArtistPlay as EventListener);
    window.addEventListener('globalPlayer:clearOverride', handleArtistClear);

    return () => {
      window.removeEventListener('globalPlayer:artistOverride', handleArtistPlay as EventListener);
      window.removeEventListener('globalPlayer:clearOverride', handleArtistClear);
    };
  }, []);

  if (!loaded) return null;

  // Build the effective track list
  let tracks: Track[];

  if (artistOverride) {
    // Artist page with soundcloud — play that single track
    tracks = [{
      id: 'artist-override',
      titulo: artistOverride.artistName,
      artista: artistOverride.artistName,
      soundcloud_url: artistOverride.soundcloud_url,
    }];
  } else {
    tracks = mainTracks;
  }

  if (tracks.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <HomeMusicPlayer
        key={artistOverride ? `artist-${artistOverride.soundcloud_url}` : 'main'}
        tracks={tracks}
        autoPlay
        isArtistMode={!!artistOverride}
      />
    </div>
  );
}
