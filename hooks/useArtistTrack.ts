'use client';

import { useEffect } from 'react';

interface Artist {
  nombre: string;
  soundcloud_url?: string;
  social_links?: { label: string; url: string }[] | { soundcloud?: string };
}

export function useArtistTrack(artist: Artist | null) {
  useEffect(() => {
    if (!artist) return;

    // Priorizar soundcloud_url directo, luego social_links legacy
    const legacySc = !Array.isArray(artist.social_links) ? artist.social_links?.soundcloud : undefined;
    const soundcloudUrl = artist.soundcloud_url || legacySc;

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
