'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { HomeMusicPlayer } from '@/components/Home/HomeMusicPlayer';
import { Play, Pause } from 'lucide-react';

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
  const [sdkReady, setSdkReady] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<any>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch main_music tracks on mount
  useEffect(() => {
    const fetchTracks = async () => {
      console.log('GlobalMusicPlayer: Fetching tracks...');
      const { data, error } = await supabase
        .from('main_music')
        .select('id, titulo, artista, soundcloud_url')
        .eq('active', true)
        .order('orden', { ascending: true });

      if (error) {
        console.error('GlobalMusicPlayer: Error fetching tracks:', error);
        setLoaded(true);
        return;
      }

      console.log('GlobalMusicPlayer: Tracks fetched:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('GlobalMusicPlayer: First track:', data[0]);
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

  // Load SoundCloud SDK
  useEffect(() => {
    if (typeof window !== 'undefined' && window.SC) {
      setSdkReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.async = true;
    script.onload = () => setSdkReady(true);
    document.body.appendChild(script);
  }, []);

  // Initialize widget when SDK is ready
  useEffect(() => {
    if (!sdkReady || !iframeRef.current || !window.SC) {
      console.log('GlobalMusicPlayer: Widget init conditions not met', { 
        sdkReady, 
        hasIframe: !!iframeRef.current, 
        hasSC: !!window.SC, 
        isMobile,
        widgetReady 
      });
      return;
    }

    console.log('GlobalMusicPlayer: Initializing widget for', isMobile ? 'mobile' : 'desktop');
    const w = window.SC.Widget(iframeRef.current);
    widgetRef.current = w;
    const Events = (window as any).SC.Widget.Events;

    console.log('GlobalMusicPlayer: Widget created, binding events...');
    
    w.bind(Events.READY, () => {
      console.log('GlobalMusicPlayer: Widget ready for', isMobile ? 'mobile' : 'desktop');
      w.setVolume(50);
      setWidgetReady(true);
      console.log('GlobalMusicPlayer: Widget ready state set to true');
      
      // Load the initial track when widget is ready
      const currentTrack = artistOverride ? {
        id: 'artist-override',
        titulo: artistOverride.artistName,
        artista: artistOverride.artistName,
        soundcloud_url: artistOverride.soundcloud_url,
      } : mainTracks[0];

      if (currentTrack) {
        console.log('GlobalMusicPlayer: Loading initial track for mobile:', currentTrack.titulo);
        w.load(currentTrack.soundcloud_url, {
          auto_play: false,
          show_artwork: false,
        });
      }
    });

    w.bind(Events.PLAY, () => {
      console.log('GlobalMusicPlayer: Mobile track started playing');
      setIsPlaying(true);
    });
    w.bind(Events.PAUSE, () => {
      console.log('GlobalMusicPlayer: Mobile track paused');
      setIsPlaying(false);
    });
    w.bind(Events.ERROR, (error: any) => {
      console.error('GlobalMusicPlayer: Mobile widget error', error);
    });
  }, [sdkReady, isMobile]);

  // Force widget initialization when tracks are loaded (for mobile)
  useEffect(() => {
    if (isMobile && sdkReady && mainTracks.length > 0 && !widgetReady && iframeRef.current) {
      console.log('GlobalMusicPlayer: Mobile tracks loaded, forcing widget initialization');
      // Re-initialize widget for mobile when tracks are available
      const w = window.SC.Widget(iframeRef.current);
      widgetRef.current = w;
      const Events = (window as any).SC.Widget.Events;

      w.bind(Events.READY, () => {
        console.log('GlobalMusicPlayer: Mobile widget ready (delayed init)');
        w.setVolume(50);
        setWidgetReady(true);
        
        const currentTrack = mainTracks[0];
        if (currentTrack) {
          console.log('GlobalMusicPlayer: Loading track for delayed mobile init:', currentTrack.titulo);
          w.load(currentTrack.soundcloud_url, {
            auto_play: false,
            show_artwork: false,
          });
        }
      });

      w.bind(Events.ERROR, (error: any) => {
        console.error('GlobalMusicPlayer: Mobile widget error (delayed init)', error);
      });
    }
  }, [isMobile, sdkReady, mainTracks, widgetReady]);

  // Load track when track changes
  useEffect(() => {
    if (!widgetRef.current) return;

    const currentTrack = artistOverride ? {
      id: 'artist-override',
      titulo: artistOverride.artistName,
      artista: artistOverride.artistName,
      soundcloud_url: artistOverride.soundcloud_url,
    } : mainTracks[0];

    if (!currentTrack) return;

    widgetRef.current.load(currentTrack.soundcloud_url, {
      auto_play: false,
      show_artwork: false,
    });
  }, [artistOverride, mainTracks]);

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

  const getEmbedUrl = (scUrl: string) => {
    const params = new URLSearchParams({
      url: scUrl,
      auto_play: 'false',
      hide_related: 'true',
      show_comments: 'false',
      show_user: 'false',
      show_reposts: 'false',
      visual: 'false',
    });
    return `https://w.soundcloud.com/player/?${params.toString()}`;
  };

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
  if (pathname && pathname.startsWith('/artistas/')) {
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
    // Mobile: botón lateral simple para play/pause
    return (
      <>
        {/* Botón lateral derecho simple */}
        <button
          onClick={() => {
            console.log('GlobalMusicPlayer: Mobile play/pause clicked', { isPlaying, hasWidget: !!widgetRef.current, widgetReady });
            if (!widgetRef.current || !widgetReady) {
              console.error('GlobalMusicPlayer: Widget not ready for mobile play/pause', { hasWidget: !!widgetRef.current, widgetReady });
              return;
            }
            if (isPlaying) {
              console.log('GlobalMusicPlayer: Mobile - pausing track');
              widgetRef.current.pause();
              setIsPlaying(false);
            } else {
              console.log('GlobalMusicPlayer: Mobile - playing track');
              widgetRef.current.play();
              setIsPlaying(true);
            }
          }}
          disabled={!widgetReady}
          className={`
            md:hidden fixed right-0 bottom-24 w-12 h-12 
            bg-manso-black rounded-full flex items-center justify-center text-white 
            shadow-lg z-40 transition-all duration-300 active:scale-95
            ${isPlaying ? 'animate-pulse' : ''}
            ${!widgetReady ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isPlaying ? (
            <Pause size={20} />
          ) : (
            <Play size={20} className="ml-0.5" />
          )}
        </button>

        {/* Hidden iframe for SoundCloud */}
        <iframe
          ref={iframeRef}
          src={getEmbedUrl(artistOverride ? artistOverride.soundcloud_url : mainTracks[0]?.soundcloud_url || '')}
          className="hidden"
          allow="autoplay"
        />
      </>
    );
  }

  // Desktop: comportamiento tipo taskbar
  return (
    <div 
      className="hidden md:block fixed bottom-0 left-0 right-0 z-40"
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
