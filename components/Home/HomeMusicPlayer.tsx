'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music } from 'lucide-react';

interface Track {
  id: string;
  titulo: string;
  artista: string;
  soundcloud_url: string;
}

interface HomeMusicPlayerProps {
  tracks: Track[];
  autoPlay?: boolean;
  isArtistMode?: boolean;
  onPlayStateChange?: (playing: boolean) => void;
}

// Re-use the SC global declared in SoundCloudPlayer.tsx
// Access Events via (window as any).SC.Widget.Events

export function HomeMusicPlayer({ tracks, autoPlay = false, isArtistMode = false, onPlayStateChange }: HomeMusicPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sdkReady, setSdkReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<any>(null);
  const prevVolumeRef = useRef(50);

  const currentTrack = tracks[currentIndex];

  // Load SoundCloud SDK
  useEffect(() => {
    console.log('HomeMusicPlayer: Loading SoundCloud SDK...');
    if (typeof window !== 'undefined' && window.SC) {
      console.log('HomeMusicPlayer: SoundCloud SDK already loaded');
      setSdkReady(true);
      return;
    }

    console.log('HomeMusicPlayer: Loading SoundCloud SDK script...');
    const script = document.createElement('script');
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.async = true;
    script.onload = () => {
      console.log('HomeMusicPlayer: SoundCloud SDK loaded successfully');
      setSdkReady(true);
    };
    script.onerror = () => {
      console.error('HomeMusicPlayer: Failed to load SoundCloud SDK');
    };
    document.body.appendChild(script);
  }, []);

  // Initialize widget when SDK is ready
  useEffect(() => {
    if (!sdkReady || !iframeRef.current || !window.SC) {
      console.log('HomeMusicPlayer: Widget init conditions not met', { sdkReady, hasIframe: !!iframeRef.current, hasSC: !!window.SC });
      return;
    }

    console.log('HomeMusicPlayer: Initializing widget...');
    const w = window.SC.Widget(iframeRef.current);
    widgetRef.current = w;
    const Events = (window as any).SC.Widget.Events;

    w.bind(Events.READY, () => {
      console.log('HomeMusicPlayer: Widget ready');
      setIsLoading(false);
      w.setVolume(volume);
      w.getDuration((dur: number) => setDuration(dur));
      if (autoPlay) {
        console.log('HomeMusicPlayer: Auto-playing track');
        w.play();
      }
    });

    w.bind(Events.PLAY, () => {
      console.log('HomeMusicPlayer: Track started playing');
      setIsPlaying(true);
      onPlayStateChange?.(true);
    });
    w.bind(Events.PAUSE, () => {
      console.log('HomeMusicPlayer: Track paused');
      setIsPlaying(false);
      onPlayStateChange?.(false);
    });
    w.bind(Events.ERROR, (error: any) => {
      console.error('HomeMusicPlayer: Widget error', error);
    });
    w.bind(Events.FINISH, () => {
      console.log('HomeMusicPlayer: Track finished');
      // Auto-advance to next track
      if (currentIndex < tracks.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setCurrentIndex(0);
      }
    });
    w.bind(Events.PLAY_PROGRESS, (data: any) => {
      setCurrentTime(data.currentPosition);
    });
  }, [sdkReady]);

  // Load new track when currentIndex changes (after initial load)
  useEffect(() => {
    if (!widgetRef.current || !currentTrack) {
      console.log('HomeMusicPlayer: Skip track load - no widget or track', { hasWidget: !!widgetRef.current, hasTrack: !!currentTrack });
      return;
    }
    
    console.log('HomeMusicPlayer: Loading track:', currentTrack.titulo, currentTrack.soundcloud_url);
    setIsLoading(true);
    setCurrentTime(0);
    setDuration(0);

    widgetRef.current.load(currentTrack.soundcloud_url, {
      auto_play: isPlaying,
      show_artwork: false,
      callback: () => {
        console.log('HomeMusicPlayer: Track loaded callback');
        setIsLoading(false);
        widgetRef.current?.getDuration((dur: number) => setDuration(dur));
        widgetRef.current?.setVolume(isMuted ? 0 : volume);
      },
    });
  }, [currentIndex]);

  const handlePlayPause = () => {
    console.log('HomeMusicPlayer: Play/Pause clicked', { isPlaying, hasWidget: !!widgetRef.current });
    if (!widgetRef.current) {
      console.error('HomeMusicPlayer: No widget available for play/pause');
      return;
    }
    if (isPlaying) {
      console.log('HomeMusicPlayer: Pausing track');
      widgetRef.current.pause();
    } else {
      console.log('HomeMusicPlayer: Playing track');
      widgetRef.current.play();
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % tracks.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    setIsMuted(val === 0);
    widgetRef.current?.setVolume(val);
  };

  const toggleMute = () => {
    if (isMuted) {
      const restored = prevVolumeRef.current || 50;
      setVolume(restored);
      setIsMuted(false);
      widgetRef.current?.setVolume(restored);
    } else {
      prevVolumeRef.current = volume;
      setVolume(0);
      setIsMuted(true);
      widgetRef.current?.setVolume(0);
    }
  };

  const handleSeek = (pos: number) => {
    widgetRef.current?.seekTo(pos);
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, '0')}`;
  };

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
    const embedUrl = `https://w.soundcloud.com/player/?${params.toString()}`;
    console.log('HomeMusicPlayer: Generated embed URL:', embedUrl);
    return embedUrl;
  };

  if (!tracks || tracks.length === 0) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full">
      {/* Hidden iframe */}
      <iframe
        ref={iframeRef}
        src={getEmbedUrl(currentTrack.soundcloud_url)}
        className="hidden"
        allow="autoplay"
      />

      {/* Slim horizontal bar player */}
      <div className="bg-black/70 backdrop-blur-xl border-t border-white/10">
        {/* Progress bar — thin line at the very top of the bar */}
        <div
          className="h-[2px] bg-manso-terra transition-all duration-300 ease-linear"
          style={{ width: `${progress}%` }}
        />

        {/* Single-row controls */}
        <div className="flex items-center gap-3 px-4 py-2 md:px-6">
          {/* Play/Pause */}
          <button
            onClick={handlePlayPause}
            disabled={isLoading}
            className="w-8 h-8 bg-manso-terra/90 text-manso-cream rounded-full flex items-center justify-center hover:bg-manso-terra transition-all active:scale-95 flex-shrink-0"
          >
            {isLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-manso-cream/30 border-t-manso-cream rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause size={14} />
            ) : (
              <Play size={14} className="ml-0.5" />
            )}
          </button>

          {/* Skip controls */}
          {tracks.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="w-6 h-6 flex items-center justify-center text-manso-cream/40 hover:text-manso-cream transition-colors flex-shrink-0"
              >
                <SkipBack size={13} />
              </button>
              <button
                onClick={handleNext}
                className="w-6 h-6 flex items-center justify-center text-manso-cream/40 hover:text-manso-cream transition-colors flex-shrink-0"
              >
                <SkipForward size={13} />
              </button>
            </>
          )}

          {/* Track info */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <Music size={11} className="text-manso-terra flex-shrink-0" />
            <span className="text-[10px] text-manso-cream/70 truncate">
              {isArtistMode && (
                <span className="text-manso-terra/80 font-medium">Escuchando a </span>
              )}
              <span className="font-bold text-manso-cream">{currentTrack.artista}</span>
              <span className="mx-1.5 text-manso-cream/30">—</span>
              {currentTrack.titulo}
            </span>
          </div>

          {/* Time */}
          <span className="text-[9px] font-mono text-manso-cream/30 flex-shrink-0 hidden sm:block">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Track dots */}
          {tracks.length > 1 && (
            <div className="hidden md:flex items-center gap-1 flex-shrink-0">
              {tracks.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`rounded-full transition-all ${
                    i === currentIndex ? 'w-4 h-1 bg-manso-terra' : 'w-1 h-1 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Volume */}
          <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
            <button onClick={toggleMute} className="text-manso-cream/40 hover:text-manso-cream transition-colors">
              {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
              className="w-14 h-[3px] bg-white/10 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #D4A574 0%, #D4A574 ${volume}%, rgba(255,255,255,0.1) ${volume}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          width: 8px;
          height: 8px;
          background: #d4a574;
          border-radius: 50%;
          cursor: pointer;
          border: 1px solid #1d1d1b;
        }
        input[type='range']::-moz-range-thumb {
          width: 8px;
          height: 8px;
          background: #d4a574;
          border-radius: 50%;
          cursor: pointer;
          border: 1px solid #1d1d1b;
        }
      `}</style>
    </div>
  );
}
