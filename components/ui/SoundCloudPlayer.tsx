'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';

interface SoundCloudPlayerProps {
  url: string;
  autoPlay?: boolean;
  showControls?: boolean;
  className?: string;
}

declare global {
  interface Window {
    SC: {
      Widget: (element: HTMLIFrameElement | string) => SoundCloudWidget;
    };
  }
}

interface SoundCloudWidget {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seekTo: (milliseconds: number) => void;
  setVolume: (volume: number) => void;
  next: () => void;
  prev: () => void;
  skip: (index: number) => void;
  bind: (event: string, callback: Function) => void;
  unbind: (event: string) => void;
  load: (url: string, options?: any) => void;
  getVolume: (callback: (volume: number) => void) => void;
  getDuration: (callback: (duration: number) => void) => void;
  getPosition: (callback: (position: number) => void) => void;
  isPaused: (callback: (paused: boolean) => void) => void;
}

export function SoundCloudPlayer({ url, autoPlay = false, showControls = true, className = '' }: SoundCloudPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [widget, setWidget] = useState<SoundCloudWidget | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    console.log('🎵 SoundCloudPlayer - Inicializando con URL:', url);
    
    // Cargar el script de SoundCloud Widget API
    if (!window.SC) {
      console.log('📦 Cargando script de SoundCloud API...');
      const script = document.createElement('script');
      script.src = 'https://w.soundcloud.com/player/api.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        console.log('✅ Script de SoundCloud API cargado');
        initializeWidget();
      };
    } else {
      console.log('✅ Script de SoundCloud API ya disponible');
      initializeWidget();
    }
  }, [url]);

  const initializeWidget = () => {
    if (!iframeRef.current || !window.SC) return;

    console.log('🎛️ Inicializando widget de SoundCloud...');
    const widgetInstance = window.SC.Widget(iframeRef.current);
    setWidget(widgetInstance);

    widgetInstance.bind((window as any).SC.Widget.Events.READY, () => {
      console.log('🎧 Widget de SoundCloud listo!');
      setIsLoading(false);
      
      // Obtener duración y volumen inicial
      widgetInstance.getDuration((dur: number) => {
        setDuration(dur);
      });

      widgetInstance.getVolume((vol: number) => {
        setVolume(vol);
      });

      if (autoPlay) {
        widgetInstance.play();
      }
    });

    widgetInstance.bind((window as any).SC.Widget.Events.PLAY, () => {
      setIsPlaying(true);
    });

    widgetInstance.bind((window as any).SC.Widget.Events.PAUSE, () => {
      setIsPlaying(false);
    });

    widgetInstance.bind((window as any).SC.Widget.Events.FINISH, () => {
      setIsPlaying(false);
    });

    widgetInstance.bind((window as any).SC.Widget.Events.PLAY_PROGRESS, (data: any) => {
      setCurrentTime(data.currentPosition);
    });
  };

  const handlePlayPause = () => {
    if (!widget) return;
    
    if (isPlaying) {
      widget.pause();
    } else {
      widget.play();
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!widget) return;
    setVolume(newVolume);
    widget.setVolume(newVolume);
  };

  const handleSeek = (position: number) => {
    if (!widget) return;
    widget.seekTo(position);
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getEmbedUrl = (soundcloudUrl: string) => {
    console.log('🔗 Convirtiendo URL a embed:', soundcloudUrl);
    
    // Validar que sea una URL de SoundCloud válida
    const soundCloudRegex = /^https?:\/\/(soundcloud\.com\/|snd\.sc\/)/;
    if (!soundCloudRegex.test(soundcloudUrl)) {
      console.error('❌ URL inválida de SoundCloud:', soundcloudUrl);
      return null;
    }
    
    // Convertir URL de SoundCloud a URL de embed
    const baseUrl = 'https://w.soundcloud.com/player/?';
    const params = new URLSearchParams({
      url: soundcloudUrl,
      auto_play: autoPlay ? 'true' : 'false',
      hide_related: 'true',
      show_comments: 'false',
      show_user: 'true',
      show_reposts: 'false',
      visual: 'false'
    });
    
    const embedUrl = baseUrl + params.toString();
    console.log('✅ URL de embed generada:', embedUrl);
    return embedUrl;
  };

  const embedUrl = getEmbedUrl(url);
    
  if (!embedUrl) {
    return (
      <div className={`soundcloud-player ${className}`}>
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
          <p className="text-red-400 text-sm">
            URL de SoundCloud inválida. Por favor, verifica la URL del artista.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`soundcloud-player ${className}`}>
      {/* iframe oculto para el widget */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="hidden"
        allow="autoplay"
      />

      {showControls && (
        <div className="bg-manso-black border-t border-manso-cream/20 p-4">
          <div className="max-w-4xl mx-auto">
            {/* Controles principales */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                {/* Botones de reproducción */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => widget?.prev()}
                    className="text-manso-cream/60 hover:text-manso-cream transition-colors"
                    disabled={!widget}
                  >
                    <SkipBack size={16} />
                  </button>
                  
                  <button
                    onClick={handlePlayPause}
                    className="w-10 h-10 bg-manso-terra text-manso-cream rounded-full flex items-center justify-center hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95"
                    disabled={!widget || isLoading}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-manso-cream/30 border-t-manso-cream rounded-full animate-spin" />
                    ) : isPlaying ? (
                      <Pause size={16} />
                    ) : (
                      <Play size={16} className="ml-0.5" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => widget?.next()}
                    className="text-manso-cream/60 hover:text-manso-cream transition-colors"
                    disabled={!widget}
                  >
                    <SkipForward size={16} />
                  </button>
                </div>

                {/* Información de la pista */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black uppercase tracking-widest text-manso-cream/60 truncate">
                    SoundCloud Player
                  </div>
                  <div className="text-sm font-medium text-manso-cream truncate">
                    {isPlaying ? 'Reproduciendo' : 'Pausado'}
                  </div>
                </div>
              </div>

              {/* Control de volumen */}
              <div className="flex items-center gap-2">
                <Volume2 size={16} className="text-manso-cream/60" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                  className="w-20 h-1 bg-manso-cream/20 rounded-full appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #D4A574 0%, #D4A574 ${volume}%, rgba(212, 165, 116, 0.2) ${volume}%, rgba(212, 165, 116, 0.2) 100%)`
                  }}
                />
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="relative">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-manso-cream/60 min-w-[40px]">
                  {formatTime(currentTime)}
                </span>
                
                <div className="flex-1 relative">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={(e) => handleSeek(parseInt(e.target.value))}
                    className="w-full h-1 bg-manso-cream/20 rounded-full appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #D4A574 0%, #D4A574 ${(currentTime / duration) * 100}%, rgba(212, 165, 116, 0.2) ${(currentTime / duration) * 100}%, rgba(212, 165, 116, 0.2) 100%)`
                    }}
                  />
                </div>
                
                <span className="text-xs font-mono text-manso-cream/60 min-w-[40px]">
                  {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: #D4A574;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #1D1D1B;
        }
        
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: #D4A574;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #1D1D1B;
        }
      `}</style>
    </div>
  );
}
