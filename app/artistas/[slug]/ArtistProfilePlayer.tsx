'use client';

import { SoundCloudPlayer } from '@/components/ui/SoundCloudPlayer';
import { useFooterPlayer } from '@/components/Layout/SoundCloudFooterPlayer';
import { Play } from 'lucide-react';
import { useState } from 'react';

interface ArtistProfilePlayerProps {
  url: string;
  artistName: string;
  imageUrl?: string;
}

export function ArtistProfilePlayer({ url, artistName, imageUrl }: ArtistProfilePlayerProps) {
  const { playTrack } = useFooterPlayer();
  const [sentToFooter, setSentToFooter] = useState(false);

  const handlePlayInFooter = () => {
    playTrack({
      url,
      artistName,
      trackTitle: undefined,
      imageUrl,
    });
    setSentToFooter(true);
  };

  return (
    <div className="space-y-4">
      <SoundCloudPlayer url={url} autoPlay={false} showControls={true} />

      <button
        onClick={handlePlayInFooter}
        className="flex items-center gap-2 px-5 py-2.5 bg-manso-terra text-manso-cream rounded-full font-black uppercase tracking-wider text-xs hover:bg-manso-cream hover:text-manso-black transition-all"
      >
        <Play size={14} className={sentToFooter ? 'hidden' : ''} />
        {sentToFooter ? 'Reproduciendo en Footer' : 'Reproducir en Footer'}
      </button>
    </div>
  );
}
