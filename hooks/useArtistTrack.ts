'use client';

import { useEffect } from 'react';

interface Artist {
  nombre: string;
  soundcloud_url?: string;
  social_links?: {
    soundcloud?: string;
  };
}

export function useArtistTrack(artist: Artist | null) {
  useEffect(() => {
    if (!artist) return;

    // Priorizar soundcloud_url directo, luego social_links.soundcloud
    const soundcloudUrl = artist.soundcloud_url || artist.social_links?.soundcloud;

    if (soundcloudUrl) {
      // Emitir evento para cambiar el track del reproductor global
      window.dispatchEvent(
        new CustomEvent('globalPlayer:artistOverride', {
          detail: { 
            artistName: artist.nombre, 
            soundcloud_url: soundcloudUrl 
          },
        })
      );
    }

    return () => {
      // Al salir de la página, volver a la música general
      window.dispatchEvent(new CustomEvent('globalPlayer:clearOverride'));
    };
  }, [artist]);
}
