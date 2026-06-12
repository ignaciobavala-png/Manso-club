'use client';

import { useEffect, useRef, useState, useCallback, useId } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2 } from 'lucide-react';

interface Props {
  videoId: string;
  title?: string;
}

type PlayerState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
  }
}

// Carga el script una sola vez por página
function loadYTScript(): Promise<void> {
  return new Promise((resolve) => {
    // API ya lista
    if (typeof window !== 'undefined' && window.YT?.Player) {
      resolve();
      return;
    }
    // Script ya insertado, encadenar callback
    if (document.getElementById('yt-iframe-api')) {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
      return;
    }
    // Primera carga
    window.onYouTubeIframeAPIReady = resolve;
    const tag = document.createElement('script');
    tag.id  = 'yt-iframe-api';
    tag.src = 'https://www.youtube.com/iframe_api'; // solo youtube.com sirve el script
    document.head.appendChild(tag);
  });
}

export function YouTubePlayer({ videoId, title }: Props) {
  // ID único estable por instancia del componente
  const uid           = useId().replace(/:/g, '');
  const playerId      = `yt-player-${uid}`;

  const containerRef  = useRef<HTMLDivElement>(null);
  const playerRef     = useRef<YT.Player | null>(null);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef    = useRef(true);

  const [state,        setState]        = useState<PlayerState>('idle');
  const [current,      setCurrent]      = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [volume,       setVolume]       = useState(80);
  const [muted,        setMuted]        = useState(false);
  const [fullscreen,   setFullscreen]   = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [fallback,     setFallback]     = useState(false);
  const hideTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPoll = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const startPoll = useCallback(() => {
    stopPoll();
    intervalRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p || !mountedRef.current) return;
      try {
        setCurrent(p.getCurrentTime());
        const d = p.getDuration();
        if (d > 0) setDuration(d);
      } catch { /* player destruído */ }
    }, 500);
  }, [stopPoll]);

  useEffect(() => {
    mountedRef.current = true;
    setState('loading');

    loadYTScript()
      .then(() => {
        if (!mountedRef.current) return;

        playerRef.current = new window.YT.Player(playerId, {
          videoId,
          host: 'https://www.youtube-nocookie.com', // embed desde nocookie
          playerVars: {
            controls:       0,
            rel:            0,
            iv_load_policy: 3,
            disablekb:      1,
            modestbranding: 1,
            playsinline:    1,
            fs:             0,
            origin:         window.location.origin,
          },
          events: {
            onReady: (e) => {
              if (!mountedRef.current) return;
              e.target.setVolume(80);
              setState('ready');
            },
            onStateChange: (e) => {
              if (!mountedRef.current) return;
              if (e.data === window.YT.PlayerState.PLAYING) {
                setState('playing'); startPoll();
              } else if (e.data === window.YT.PlayerState.PAUSED) {
                setState('paused');  stopPoll();
              } else if (e.data === window.YT.PlayerState.ENDED) {
                setState('ended');   stopPoll();
              }
            },
            onError: () => { if (mountedRef.current) setFallback(true); },
          },
        });
      })
      .catch(() => { if (mountedRef.current) setFallback(true); });

    return () => {
      mountedRef.current = false;
      stopPoll();
      try { playerRef.current?.destroy(); playerRef.current = null; } catch { /* ok */ }
    };
  // videoId cambia → recrea el player desde cero
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Auto-ocultar controles tras 3s reproduciendo
  const revealControls = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (mountedRef.current) setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    if (state !== 'playing') {
      setShowControls(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    }
  }, [state]);

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (state === 'playing') p.pauseVideo(); else p.playVideo();
  }, [state]);

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    playerRef.current?.seekTo(t, true);
    setCurrent(t);
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    setMuted(v === 0);
    playerRef.current?.setVolume(v);
    if (v > 0) playerRef.current?.unMute();
  };

  const toggleMute = () => {
    const p = playerRef.current;
    if (!p) return;
    if (muted) { p.unMute(); p.setVolume(volume || 80); setMuted(false); }
    else        { p.mute();  setMuted(true); }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen();
    else document.exitFullscreen();
  };

  if (fallback) {
    return (
      <div className="w-full aspect-video rounded-[20px] overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  const isActive = ['ready', 'playing', 'paused', 'ended'].includes(state);
  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-[20px] overflow-hidden bg-black select-none"
      onMouseMove={revealControls}
      onTouchStart={revealControls}
    >
      {/* Div con ID estable — YouTube inserta el iframe aquí */}
      <div id={playerId} className="w-full h-full" />

      {/* Overlay transparente — bloquea toda la UI nativa de YouTube */}
      <div
        className="absolute inset-0 cursor-pointer z-10"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
      />

      {/* Spinner de carga */}
      {state === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 pointer-events-none">
          <Loader2 size={32} className="text-manso-cream/40 animate-spin" />
        </div>
      )}

      {/* Botón play central cuando está listo o terminó */}
      {(state === 'ready' || state === 'ended') && (
        <div
          className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-16 h-16 rounded-full bg-manso-terra/90 backdrop-blur-sm flex items-center justify-center shadow-xl hover:bg-manso-terra transition-colors">
            <Play size={24} className="text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Controles — se ocultan solos mientras reproduce */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300 ${
          showControls || !isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Barra de progreso */}
        <div className="px-4 pb-1 pt-6">
          <div className="relative h-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={current}
              step={0.5}
              onChange={seek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-full h-full bg-white/20 rounded-full overflow-hidden pointer-events-none">
              <div
                className="h-full bg-manso-terra rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Fila de botones */}
        <div className="flex items-center gap-3 px-4 pb-4 pt-2">
          <button
            onClick={togglePlay}
            className="text-white hover:text-manso-terra transition-colors p-1 min-w-[24px]"
            aria-label={state === 'playing' ? 'Pausar' : 'Reproducir'}
          >
            {state === 'playing'
              ? <Pause size={18} className="fill-current" />
              : <Play  size={18} className="fill-current ml-0.5" />
            }
          </button>

          <span className="text-white/60 text-[10px] font-mono tabular-nums whitespace-nowrap">
            {formatTime(current)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Volumen — solo desktop */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-white/60 hover:text-white transition-colors p-1"
              aria-label={muted ? 'Activar sonido' : 'Silenciar'}
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : volume}
              onChange={changeVolume}
              className="w-20 h-1 accent-manso-terra cursor-pointer"
              aria-label="Volumen"
            />
          </div>

          <button
            onClick={toggleFullscreen}
            className="text-white/60 hover:text-white transition-colors p-1"
            aria-label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
