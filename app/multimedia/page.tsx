'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ParticleBackground } from '@/components/Home/ParticleBackground';

interface Video {
  id: string;
  titulo: string;
  youtube_url: string;
  descripcion?: string;
  orden: number;
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function YouTubeEmbed({ videoId, titulo }: { videoId: string; titulo: string }) {
  const [playing, setPlaying] = useState(false);

  const src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&controls=1&color=white`;

  return (
    <div className="group">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900">
        {playing ? (
          <iframe
            src={src}
            title={titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        ) : (
          <>
            {/* Thumbnail */}
            <img
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt={titulo}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Overlay oscuro */}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300" />
            {/* Botón play */}
            <button
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex items-center justify-center"
              aria-label={`Reproducir ${titulo}`}
            >
              <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20">
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-1" />
              </div>
            </button>
          </>
        )}
      </div>
      <div className="mt-4 px-1">
        <h3 className="text-manso-cream font-black uppercase italic tracking-tighter text-xl leading-tight">
          {titulo}
        </h3>
      </div>
    </div>
  );
}

export default function MultimediaPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('multimedia_videos')
      .select('id, titulo, youtube_url, descripcion, orden')
      .eq('active', true)
      .order('orden', { ascending: true })
      .then(({ data }) => {
        setVideos(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="relative min-h-screen bg-manso-black">
      <ParticleBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 pt-40 pb-32">
        <p className="text-[9px] font-black uppercase tracking-[0.6em] text-manso-terra mb-6">
          Manso Club
        </p>
        <h1 className="text-[clamp(3rem,9vw,7rem)] font-black uppercase italic tracking-tighter leading-none text-manso-cream mb-20">
          Multimedia
        </h1>

        {loading ? (
          <div className="flex items-center gap-3 text-manso-cream/30">
            <div className="w-4 h-4 border border-manso-cream/20 border-t-manso-cream/60 rounded-full animate-spin" />
            <span className="text-[10px] uppercase tracking-widest font-black">Cargando...</span>
          </div>
        ) : videos.length === 0 ? (
          <div className="py-20 text-manso-cream/30 text-center">
            <p className="text-[10px] uppercase tracking-widest">Próximamente</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">
            {videos.map(video => {
              const videoId = getYouTubeId(video.youtube_url);
              if (!videoId) return null;
              return (
                <YouTubeEmbed
                  key={video.id}
                  videoId={videoId}
                  titulo={video.titulo}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
