'use client';

import { useState } from 'react';
import { X, Music, Instagram, ExternalLink, Play } from 'lucide-react';
import { SoundCloudPlayer } from './SoundCloudPlayer';

interface Artist {
  id: string;
  nombre: string;
  bio?: string;
  imagen_url?: string;
  redes_sociales?: {
    instagram?: string;
    spotify?: string;
    soundcloud?: string;
  };
}

interface ArtistModalProps {
  artist: Artist | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ArtistModal({ artist, isOpen, onClose }: ArtistModalProps) {
  const [isPlayingInFooter, setIsPlayingInFooter] = useState(false);

  if (!isOpen || !artist) return null;

  const handlePlayInFooter = () => {
    if (artist.redes_sociales?.soundcloud) {
      // Disparar evento para el GlobalMusicPlayer
      const event = new CustomEvent('globalPlayer:artistOverride', {
        detail: {
          artistName: artist.nombre,
          soundcloud_url: artist.redes_sociales.soundcloud
        }
      });
      window.dispatchEvent(event);
      setIsPlayingInFooter(true);
    }
  };

  const handleStopInFooter = () => {
    // El footer player se cerrará automáticamente al cambiar de artista
    setIsPlayingInFooter(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-manso-black rounded-[2.5rem] border border-manso-cream/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/80 transition-colors z-10 border border-white/20"
          >
            <X size={20} className="text-white" />
          </button>
          
          {/* Imagen del artista */}
          <div className="aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-t-[2.5rem]">
            <img 
              src={artist.imagen_url || '/manso.png'} 
              alt={artist.nombre}
              className="w-full h-full object-cover"
            />
            
            {/* Overlay con nombre */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-8">
              <div>
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-manso-cream mb-2">
                  {artist.nombre}
                </h1>
                {artist.bio && (
                  <p className="text-lg text-manso-cream/80 max-w-2xl">
                    {artist.bio}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-8 space-y-8">
          {/* Sección de Música */}
          {artist.redes_sociales?.soundcloud && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black uppercase tracking-wider text-manso-cream flex items-center gap-2">
                  <Music size={24} className="text-manso-terra" />
                  Música
                </h2>
                
                <button
                  onClick={isPlayingInFooter ? handleStopInFooter : handlePlayInFooter}
                  className="flex items-center gap-2 px-4 py-2 bg-manso-terra text-manso-cream rounded-full font-black uppercase tracking-wider text-sm hover:bg-manso-cream hover:text-manso-black transition-all"
                >
                  <Play size={16} className={isPlayingInFooter ? 'hidden' : ''} />
                  {isPlayingInFooter ? 'En Footer' : 'Reproducir en Footer'}
                </button>
              </div>

              {/* Reproductor integrado */}
              <div className="bg-manso-cream/5 rounded-2xl p-6 border border-manso-cream/10">
                <SoundCloudPlayer 
                  url={artist.redes_sociales.soundcloud} 
                  autoPlay={false}
                  showControls={true}
                />
              </div>
            </div>
          )}

          {/* Redes Sociales */}
          {artist.redes_sociales && (
            <div className="space-y-4">
              <h2 className="text-xl font-black uppercase tracking-wider text-manso-cream">
                Conecta
              </h2>
              
              <div className="flex flex-wrap gap-4">
                {artist.redes_sociales.instagram && (
                  <a
                    href={`https://instagram.com/${artist.redes_sociales.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-manso-cream/10 border border-manso-cream/20 rounded-full text-manso-cream hover:bg-manso-cream/20 transition-colors"
                  >
                    <Instagram size={18} />
                    <span className="text-sm font-medium">@{artist.redes_sociales.instagram.replace('@', '')}</span>
                  </a>
                )}
                
                {artist.redes_sociales.spotify && (
                  <a
                    href={artist.redes_sociales.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-manso-cream/10 border border-manso-cream/20 rounded-full text-manso-cream hover:bg-manso-cream/20 transition-colors"
                  >
                    <ExternalLink size={18} />
                    <span className="text-sm font-medium">Spotify</span>
                  </a>
                )}
                
                {artist.redes_sociales.soundcloud && (
                  <a
                    href={artist.redes_sociales.soundcloud}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-manso-cream/10 border border-manso-cream/20 rounded-full text-manso-cream hover:bg-manso-cream/20 transition-colors"
                  >
                    <ExternalLink size={18} />
                    <span className="text-sm font-medium">SoundCloud</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Biografía completa */}
          {artist.bio && (
            <div className="space-y-4">
              <h2 className="text-xl font-black uppercase tracking-wider text-manso-cream">
                Biografía
              </h2>
              <div className="bg-manso-cream/5 rounded-2xl p-6 border border-manso-cream/10">
                <p className="text-manso-cream/80 leading-relaxed">
                  {artist.bio}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
