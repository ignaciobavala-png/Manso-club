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
  const [showMobileBar, setShowMobileBar] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<any>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollY = useRef(0);

  // Fetch main_music tracks on mount
  useEffect(() => {
    const fetchTracks = async () => {
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
      return;
    }

    const w = window.SC.Widget(iframeRef.current);
    widgetRef.current = w;
    const Events = (window as any).SC.Widget.Events;

    
    w.bind(Events.READY, () => {
      w.setVolume(50);
      setWidgetReady(true);
      
      // Load the initial track when widget is ready
      const currentTrack = artistOverride ? {
        id: 'artist-override',
        titulo: artistOverride.artistName,
        artista: artistOverride.artistName,
        soundcloud_url: artistOverride.soundcloud_url,
      } : mainTracks[0];

      if (currentTrack) {
        w.load(currentTrack.soundcloud_url, {
          auto_play: false,
          show_artwork: false,
        });
      }
    });

    w.bind(Events.PLAY, () => {
      setIsPlaying(true);
    });
    w.bind(Events.PAUSE, () => {
      setIsPlaying(false);
    });
    w.bind(Events.ERROR, (error: any) => {
      console.error('GlobalMusicPlayer: Mobile widget error', error);
    });
  }, [sdkReady, isMobile]);

  // Force widget initialization when tracks are loaded (for mobile)
  useEffect(() => {
    if (isMobile && sdkReady && mainTracks.length > 0 && !widgetReady && iframeRef.current) {
      // Re-initialize widget for mobile when tracks are available
      const w = window.SC.Widget(iframeRef.current);
      widgetRef.current = w;
      const Events = (window as any).SC.Widget.Events;

      w.bind(Events.READY, () => {
        w.setVolume(50);
        setWidgetReady(true);
        
        const currentTrack = mainTracks[0];
        if (currentTrack) {
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

  // Hide/show mobile bar on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 50) {
        setShowMobileBar(true);
      } else if (currentScrollY > lastScrollY.current) {
        setShowMobileBar(false); // scrolleando hacia abajo
      } else {
        setShowMobileBar(true); // scrolleando hacia arriba
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Apply dynamic padding to body on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isMobileView = window.innerWidth < 768;
    if (isMobileView) {
      document.body.style.paddingBottom = showMobileBar ? '56px' : '0px';
    }
    return () => {
      document.body.style.paddingBottom = '';
    };
  }, [showMobileBar]);

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
        {/* Mini barra fija estilo Spotify */}
        <div className={`md:hidden fixed bottom-0 left-0 right-0 z-30 bg-manso-black border-t border-manso-cream/10 transition-transform duration-300 ${showMobileBar ? 'translate-y-0' : 'translate-y-full'}`}>
          <button
            onClick={() => {
              if (!widgetRef.current || !widgetReady) {
                console.error('GlobalMusicPlayer: Widget not ready for mobile play/pause', { hasWidget: !!widgetRef.current, widgetReady });
                return;
              }
              if (isPlaying) {
                widgetRef.current.pause();
                setIsPlaying(false);
              } else {
                widgetRef.current.play();
                setIsPlaying(true);
              }
            }}
            disabled={!widgetReady}
            className="w-full flex items-center gap-3 px-4 py-3 active:bg-manso-cream/5 transition-all"
          >
            {/* Ícono play/pause */}
            <div className={`w-8 h-8 rounded-full bg-manso-terra flex items-center justify-center shrink-0 ${isPlaying ? 'animate-pulse' : ''}`}>
              {isPlaying ? <Pause size={14} className="text-white" /> : <Play size={14} className="text-white ml-0.5" />}
            </div>
            
            {/* Info del track */}
            <div className="flex-1 text-left overflow-hidden">
              <p className="text-manso-cream text-[11px] font-black uppercase tracking-wider truncate">
                {artistOverride ? artistOverride.artistName : mainTracks[0]?.titulo || 'MANSO RADIO'}
              </p>
              <p className="text-manso-cream/40 text-[9px] uppercase tracking-widest truncate">
                {artistOverride ? 'ARTISTA DESTACADO' : mainTracks[0]?.artista || 'En vivo'}
              </p>
            </div>
            
            {/* Indicador de estado */}
            <div className={`w-2 h-2 rounded-full shrink-0 ${isPlaying ? 'bg-manso-terra animate-pulse' : 'bg-manso-cream/20'}`} />
          </button>
        </div>

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
