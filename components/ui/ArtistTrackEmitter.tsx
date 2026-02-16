'use client';

import { useEffect } from 'react';

interface ArtistTrackEmitterProps {
  artistName: string;
  soundcloudUrl?: string;
}

export function ArtistTrackEmitter({ artistName, soundcloudUrl }: ArtistTrackEmitterProps) {
  useEffect(() => {
    if (soundcloudUrl) {
      // Tell the global player to switch to this artist's track
      window.dispatchEvent(
        new CustomEvent('globalPlayer:artistOverride', {
          detail: { artistName, soundcloud_url: soundcloudUrl },
        })
      );
    }

    return () => {
      // When leaving the artist page, revert to main music
      window.dispatchEvent(new CustomEvent('globalPlayer:clearOverride'));
    };
  }, [artistName, soundcloudUrl]);

  // Renders nothing — purely an event emitter
  return null;
}
