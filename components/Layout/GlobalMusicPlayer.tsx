'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { HomeMusicPlayer } from '@/components/Home/HomeMusicPlayer';
import { Music } from 'lucide-react';

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
  const pathname = usePathname();
  const [mainTracks, setMainTracks] = useState<Track[]>([]);
  const [artistOverride, setArtistOverride] = useState<ArtistOverride | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Detectar dispositivo mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Manejo de hover para mostrar/ocultar reproductor
  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 2000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
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

  // Ocultar reproductor en páginas de artista
  console.log('GlobalMusicPlayer pathname:', pathname);
  if (pathname && pathname.startsWith('/artistas/')) {
    console.log('Ocultando reproductor global en página de artista');
    return null;
  }

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

  if (isMobile) {
    // Mobile: botón flotante
    return (
      <>
        {/* Botón flotante */}
        <button
          onClick={() => setIsVisible(!isVisible)}
          className={`
            fixed bottom-4 left-4 w-12 h-12 bg-gray-800 
            rounded-full flex items-center justify-center text-white shadow-lg z-40
            transition-all duration-300 ease-in-out hover:scale-110
            ${isPlaying ? 'animate-pulse' : ''}
          `}
        >
          <Music size={20} />
        </button>

        {/* Reproductor completo en overlay */}
        {isVisible && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 flex items-end justify-center"
            onClick={() => setIsVisible(false)}
          >
            <div 
              className="bg-white w-full max-h-80 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <HomeMusicPlayer
                key={artistOverride ? `artist-${artistOverride.soundcloud_url}` : 'main'}
                tracks={tracks}
                autoPlay={false}
                isArtistMode={!!artistOverride}
                onPlayStateChange={(playing: boolean) => setIsPlaying(playing)}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop: comportamiento tipo taskbar
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-40"
      data-player="global"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Contenedor del reproductor con animación */}
      <div 
        className={`
          transition-transform duration-300 ease-in-out
          ${isVisible ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        <HomeMusicPlayer
          key={artistOverride ? `artist-${artistOverride.soundcloud_url}` : 'main'}
          tracks={tracks}
          autoPlay={false}
          isArtistMode={!!artistOverride}
          onPlayStateChange={(playing: boolean) => setIsPlaying(playing)}
        />
      </div>
    </div>
  );
}
