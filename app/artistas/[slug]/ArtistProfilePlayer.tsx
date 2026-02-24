'use client';

import { SoundCloudPlayer } from '@/components/ui/SoundCloudPlayer';
import { Play, Music, List } from 'lucide-react';
import { useState } from 'react';
import { detectPlayerType, getYouTubeEmbedUrl, PlayerType } from '@/lib/player-utils';

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

export function ArtistProfilePlayer({ url, artistName, imageUrl, tracks }: ArtistProfilePlayerProps) {
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [currentTrackUrl, setCurrentTrackUrl] = useState<string | undefined>(url);

  // Determinar qué URL usar: tracks específicos o fallback al url del artista
  const hasTracks = tracks && tracks.length > 0;
  const displayUrl = currentTrackUrl || url;

  const handlePlayTrack = (track: ArtistTrack) => {
    setActiveTrackId(track.id);
    setCurrentTrackUrl(track.soundcloud_url);
    
    // Disparar evento para el GlobalMusicPlayer
    const event = new CustomEvent('globalPlayer:artistOverride', {
      detail: {
        artistName,
        soundcloud_url: track.soundcloud_url
      }
    });
    window.dispatchEvent(event);
  };


  return (
    <div className="space-y-4">
      {displayUrl && (
        <div className="w-full">
          {(() => {
            const playerType = detectPlayerType(displayUrl);
            
            switch (playerType) {
              case 'soundcloud':
                return <SoundCloudPlayer url={displayUrl} autoPlay={false} showControls={true} />;
              
              case 'youtube':
                const embedUrl = getYouTubeEmbedUrl(displayUrl);
                if (embedUrl) {
                  return (
                    <iframe
                      src={embedUrl}
                      className="w-full h-[200px] border-0 rounded-xl"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }
                return <div className="text-manso-cream/60 text-sm">Formato no soportado</div>;
              
              case 'unknown':
              default:
                return <div className="text-manso-cream/60 text-sm">Formato no soportado</div>;
            }
          })()}
        </div>
      )}

      {/* Playlist de tracks si existen */}
      {hasTracks && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-manso-cream/60">
            <List size={16} />
            <h3 className="text-xs font-black uppercase tracking-wider">Tracks</h3>
          </div>
          <div className="space-y-2">
            {tracks.map((track) => (
              <button
                key={track.id}
                onClick={() => handlePlayTrack(track)}
                className={`w-full text-left p-3 rounded-xl border transition-all group ${
                  activeTrackId === track.id
                    ? 'bg-manso-terra/20 border-manso-terra text-manso-cream'
                    : 'bg-manso-cream/5 border-manso-cream/10 text-manso-cream/70 hover:bg-manso-cream/10 hover:text-manso-cream'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Music 
                      size={16} 
                      className={`transition-colors ${
                        activeTrackId === track.id ? 'text-manso-terra' : 'text-manso-cream/40'
                      }`} 
                    />
                    <div>
                      <p className={`text-sm font-medium ${
                        activeTrackId === track.id ? 'font-bold text-manso-terra' : ''
                      }`}>
                        {track.titulo}
                      </p>
                      <p className="text-xs text-manso-cream/40">
                        Track #{track.orden}
                      </p>
                    </div>
                  </div>
                  <Play 
                    size={14} 
                    className={`transition-all ${
                      activeTrackId === track.id 
                        ? 'text-manso-terra scale-110' 
                        : 'text-manso-cream/40 group-hover:text-manso-cream'
                    }`} 
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
