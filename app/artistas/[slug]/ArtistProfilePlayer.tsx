'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Play, Pause, SkipBack, SkipForward, Music } from 'lucide-react';
import { detectPlayerType, getYouTubeEmbedUrl } from '@/lib/player-utils';

interface ArtistTrack {
  id: string;
  titulo: string;
  soundcloud_url: string;
  orden: number;
}

interface ArtistProfilePlayerProps {
  url?: string;
  artistName: string;
  imageUrl?: string;
  tracks?: ArtistTrack[];
}

export function ArtistProfilePlayer({ url, artistName, imageUrl, tracks = [] }: ArtistProfilePlayerProps) {
  const allTracks: ArtistTrack[] = tracks.length > 0
    ? tracks
    : url && detectPlayerType(url) === 'soundcloud'
      ? [{ id: 'main', titulo: artistName, soundcloud_url: url, orden: 1 }]
      : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sdkReady, setSdkReady] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<any>(null);
  const isPlayingRef = useRef(false);

  const currentTrack = allTracks[currentIndex];

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).SC) {
      setSdkReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.async = true;
    script.onload = () => setSdkReady(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!sdkReady || !iframeRef.current || !(window as any).SC) return;

    const SC = (window as any).SC;
    const w = SC.Widget(iframeRef.current);
    widgetRef.current = w;
    const Events = SC.Widget.Events;

    w.bind(Events.READY, () => {
      setIsLoading(false);
      setWidgetReady(true);
      w.setVolume(70);
      w.getDuration((dur: number) => setDuration(dur));
    });
    w.bind(Events.PLAY, () => setIsPlaying(true));
    w.bind(Events.PAUSE, () => setIsPlaying(false));
    w.bind(Events.FINISH, () => {
      setCurrentIndex(prev => (prev + 1 < allTracks.length ? prev + 1 : 0));
    });
    w.bind(Events.PLAY_PROGRESS, (data: any) => {
      setCurrentTime(data.currentPosition);
    });
    w.bind(Events.ERROR, () => setIsLoading(false));
  }, [sdkReady]);

  useEffect(() => {
    if (!widgetRef.current || !currentTrack) return;
    setIsLoading(true);
    setCurrentTime(0);
    setDuration(0);
    widgetRef.current.load(currentTrack.soundcloud_url, {
      auto_play: isPlayingRef.current,
      callback: () => {
        setIsLoading(false);
        widgetRef.current?.getDuration((dur: number) => setDuration(dur));
        widgetRef.current?.setVolume(70);
      },
    });
    window.dispatchEvent(new CustomEvent('globalPlayer:artistOverride', {
      detail: { artistName, soundcloud_url: currentTrack.soundcloud_url },
    }));
  }, [currentIndex]);

  const handlePlayPause = () => {
    if (!widgetRef.current || !widgetReady) return;
    if (isPlayingRef.current) widgetRef.current.pause();
    else widgetRef.current.play();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!widgetRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    widgetRef.current.seekTo(ratio * duration);
  };

  const handlePrev = () => setCurrentIndex(prev => (prev - 1 + allTracks.length) % allTracks.length);
  const handleNext = () => setCurrentIndex(prev => (prev + 1) % allTracks.length);

  const selectTrack = (i: number) => {
    if (i === currentIndex) handlePlayPause();
    else setCurrentIndex(i);
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
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
    return `https://w.soundcloud.com/player/?${params.toString()}`;
  };

  // YouTube fallback — no tracks, url is YouTube
  if (allTracks.length === 0 && url) {
    const playerType = detectPlayerType(url);
    if (playerType === 'youtube') {
      const embedUrl = getYouTubeEmbedUrl(url);
      return embedUrl ? (
        <iframe
          src={embedUrl}
          className="w-full h-[200px] border-0 rounded-xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : null;
    }
    return null;
  }

  if (allTracks.length === 0) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-2">
      {/* Player card */}
      <div className="relative rounded-2xl overflow-hidden border border-manso-cream/10">
        {/* Blurred backdrop from artist image */}
        {imageUrl && (
          <div
            className="absolute inset-0 scale-110"
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(40px)',
              opacity: 0.2,
            }}
          />
        )}
        <div className="absolute inset-0 bg-manso-black/75" />

        <div className="relative z-10 p-5 space-y-5">
          {/* Artwork + track info */}
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-manso-cream/5 border border-manso-cream/10 shrink-0">
              {imageUrl ? (
                <Image src={imageUrl} alt={artistName} fill sizes="56px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music size={20} className="text-manso-cream/20" />
                </div>
              )}
              {isPlaying && (
                <div className="absolute inset-0 bg-manso-black/50 flex items-center justify-center">
                  <EqualizerBars />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-manso-terra mb-1">
                {isPlaying ? 'Reproduciendo' : 'En pausa'}
              </p>
              <p className="text-manso-cream font-bold text-sm truncate leading-tight">
                {currentTrack.titulo}
              </p>
              <p className="text-manso-cream/40 text-xs mt-0.5 truncate">{artistName}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div
              className="h-1 bg-manso-cream/10 rounded-full cursor-pointer group relative"
              onClick={handleSeek}
            >
              <div
                className="absolute inset-y-0 left-0 bg-manso-terra rounded-full transition-[width] duration-100"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-manso-cream rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-manso-cream/30">
              <span>{formatTime(currentTime)}</span>
              <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={handlePrev}
              disabled={allTracks.length <= 1}
              className="text-manso-cream/40 hover:text-manso-cream disabled:opacity-20 transition-colors"
            >
              <SkipBack size={18} />
            </button>

            <button
              onClick={handlePlayPause}
              disabled={isLoading || !widgetReady}
              className="w-12 h-12 bg-manso-terra hover:bg-manso-terra/80 text-manso-cream rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 shadow-lg"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-manso-cream/30 border-t-manso-cream rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause size={18} />
              ) : (
                <Play size={18} className="ml-0.5" />
              )}
            </button>

            <button
              onClick={handleNext}
              disabled={allTracks.length <= 1}
              className="text-manso-cream/40 hover:text-manso-cream disabled:opacity-20 transition-colors"
            >
              <SkipForward size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Track list */}
      {allTracks.length > 1 && (
        <div className="rounded-2xl border border-manso-cream/10 overflow-hidden">
          {allTracks.map((track, i) => {
            const isActive = i === currentIndex;
            return (
              <button
                key={track.id}
                onClick={() => selectTrack(i)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all group border-b border-manso-cream/5 last:border-0 ${
                  isActive ? 'bg-manso-cream/[0.07]' : 'hover:bg-manso-cream/5'
                }`}
              >
                {/* Number or equalizer */}
                <div className="w-5 flex items-center justify-center shrink-0" style={{ height: '16px' }}>
                  {isActive && isPlaying ? (
                    <EqualizerBars small />
                  ) : (
                    <span className={`text-[10px] font-mono ${
                      isActive ? 'text-manso-terra' : 'text-manso-cream/20 group-hover:text-manso-cream/40'
                    }`}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  )}
                </div>

                {/* Title */}
                <span className={`flex-1 text-sm truncate transition-colors ${
                  isActive
                    ? 'text-manso-cream font-semibold'
                    : 'text-manso-cream/60 group-hover:text-manso-cream'
                }`}>
                  {track.titulo}
                </span>

                {/* Play icon on hover (only non-active) */}
                {!isActive && (
                  <Play size={12} className="opacity-0 group-hover:opacity-60 text-manso-cream transition-opacity shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Hidden SC iframe */}
      {currentTrack && (
        <iframe
          ref={iframeRef}
          src={getEmbedUrl(currentTrack.soundcloud_url)}
          className="hidden"
          allow="autoplay"
        />
      )}
    </div>
  );
}

function EqualizerBars({ small = false }: { small?: boolean }) {
  const maxH = small ? 12 : 16;
  return (
    <div className="flex items-end gap-[2px]" style={{ height: `${maxH}px` }}>
      <div className="w-[3px] bg-manso-terra rounded-sm animate-eq-1" />
      <div className="w-[3px] bg-manso-terra rounded-sm animate-eq-2" />
      <div className="w-[3px] bg-manso-terra rounded-sm animate-eq-3" />
    </div>
  );
}
