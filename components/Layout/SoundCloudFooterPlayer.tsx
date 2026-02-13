'use client';

import { useState, useEffect } from 'react';
import { SoundCloudPlayer } from '../SoundCloudPlayer';
import { X, Music, ChevronUp, ChevronDown } from 'lucide-react';

interface CurrentTrack {
  url: string;
  artistName: string;
  trackTitle?: string;
  imageUrl?: string;
}

export function SoundCloudFooterPlayer() {
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Escuchar eventos globales para controlar el reproductor
  useEffect(() => {
    const handlePlayTrack = (event: CustomEvent<CurrentTrack>) => {
      console.log('🎶 Footer Player - Recibiendo track:', event.detail);
      console.log('🎤 Artista:', event.detail.artistName);
      console.log('🔗 URL:', event.detail.url);
      
      setCurrentTrack(event.detail);
      setIsVisible(true);
      setIsMinimized(false);
    };

    const handleStopTrack = () => {
      setCurrentTrack(null);
      setIsVisible(false);
    };

    const handleMinimizePlayer = () => {
      setIsMinimized(!isMinimized);
    };

    window.addEventListener('playSoundCloudTrack', handlePlayTrack as EventListener);
    window.addEventListener('stopSoundCloudTrack', handleStopTrack);
    window.addEventListener('minimizeFooterPlayer', handleMinimizePlayer);

    return () => {
      window.removeEventListener('playSoundCloudTrack', handlePlayTrack as EventListener);
      window.removeEventListener('stopSoundCloudTrack', handleStopTrack);
      window.removeEventListener('minimizeFooterPlayer', handleMinimizePlayer);
    };
  }, [isMinimized]);

  if (!isVisible || !currentTrack) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-manso-black border-t border-manso-cream/20 z-50 transition-all duration-300 ${
      isMinimized ? 'h-16' : 'h-32'
    }`}>
      {/* Header del reproductor minimizable */}
      <div className="flex items-center justify-between p-3 border-b border-manso-cream/10">
        <div className="flex items-center gap-3">
          {/* Icono y info */}
          <div className="flex items-center gap-2">
            <Music size={16} className="text-manso-terra" />
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-widest text-manso-cream/60 truncate">
                {currentTrack.artistName}
              </div>
              {!isMinimized && currentTrack.trackTitle && (
                <div className="text-sm font-medium text-manso-cream truncate">
                  {currentTrack.trackTitle}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controles de ventana */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-8 h-8 flex items-center justify-center text-manso-cream/60 hover:text-manso-cream transition-colors"
          >
            {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          <button
            onClick={() => {
              setCurrentTrack(null);
              setIsVisible(false);
            }}
            className="w-8 h-8 flex items-center justify-center text-manso-cream/60 hover:text-manso-cream transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Reproductor expandido */}
      {!isMinimized && (
        <div className="p-3">
          <SoundCloudPlayer 
            url={currentTrack.url} 
            autoPlay={true}
            showControls={true}
            className="w-full"
          />
        </div>
      )}

      {/* Indicador cuando está minimizado */}
      {isMinimized && (
        <div className="absolute top-1/2 left-4 -translate-y-1/2 flex items-center gap-2">
          <div className="w-2 h-2 bg-manso-terra rounded-full animate-pulse" />
          <span className="text-xs text-manso-cream/60">Reproduciendo</span>
        </div>
      )}
    </div>
  );
}

// Hook global para controlar el reproductor
export const useFooterPlayer = () => {
  const playTrack = (track: CurrentTrack) => {
    const event = new CustomEvent('playSoundCloudTrack', { detail: track });
    window.dispatchEvent(event);
  };

  const stopTrack = () => {
    const event = new CustomEvent('stopSoundCloudTrack');
    window.dispatchEvent(event);
  };

  const minimizePlayer = () => {
    const event = new CustomEvent('minimizeFooterPlayer');
    window.dispatchEvent(event);
  };

  return { playTrack, stopTrack, minimizePlayer };
};
