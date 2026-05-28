'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ParticleBackground } from '@/components/Home/ParticleBackground';
import { Play, Expand } from 'lucide-react';

interface MediaItem {
  id: string;
  titulo: string;
  youtube_url?: string;
  archivo_url?: string;
  descripcion?: string;
  tipo: string;
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
            <img
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt={titulo}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300" />
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

function VideoEmbed({ src, titulo }: { src: string; titulo: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="group">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900">
        {playing ? (
          <video
            src={src}
            controls
            className="w-full h-full"
            autoPlay
          />
        ) : (
          <>
            <video
              src={src}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              muted
              preload="metadata"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300" />
            <button
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex items-center justify-center"
              aria-label={`Reproducir ${titulo}`}
            >
              <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20">
                <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
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

function ImageCard({ src, titulo }: { src: string; titulo: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="group cursor-pointer" onClick={() => setExpanded(true)}>
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900">
          <img
            src={src}
            alt={titulo}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Expand className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="mt-4 px-1">
          <h3 className="text-manso-cream font-black uppercase italic tracking-tighter text-xl leading-tight">
            {titulo}
          </h3>
        </div>
      </div>

      {/* Lightbox */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-10"
          onClick={() => setExpanded(false)}
        >
          <button
            onClick={() => setExpanded(false)}
            className="absolute top-6 right-6 text-white/60 hover:text-white text-2xl z-10"
            aria-label="Cerrar"
          >
            ✕
          </button>
          <img
            src={src}
            alt={titulo}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

type FilterKey = 'todo' | 'videos' | 'fotos';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'todo',   label: 'Todo'   },
  { key: 'videos', label: 'Videos' },
  { key: 'fotos',  label: 'Fotos'  },
];

function matchesFilter(item: MediaItem, filter: FilterKey) {
  if (filter === 'todo') return true;
  if (filter === 'videos') return item.tipo === 'youtube' || item.tipo === 'video';
  if (filter === 'fotos') return item.tipo === 'imagen';
  return true;
}

export default function MultimediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('todo');

  useEffect(() => {
    supabase
      .from('multimedia_videos')
      .select('id, titulo, youtube_url, archivo_url, descripcion, tipo, orden')
      .eq('active', true)
      .order('orden', { ascending: true })
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, []);

  const visible = items.filter(i => matchesFilter(i, filter));

  return (
    <div className="relative min-h-screen bg-manso-black">
      <ParticleBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 pt-40 pb-32">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none text-manso-cream mb-6">
            Multimedia
          </h1>

          {/* Tabs de filtro */}
          <div className="flex items-center gap-1">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-5 py-2 text-xs font-black uppercase tracking-widest transition-all duration-200 rounded-full ${
                  filter === key
                    ? 'bg-manso-cream text-manso-black'
                    : 'text-manso-cream/40 hover:text-manso-cream/70'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-px bg-manso-cream/10 mb-14" />

        {loading ? (
          <div className="flex items-center gap-3 text-manso-cream/30">
            <div className="w-4 h-4 border border-manso-cream/20 border-t-manso-cream/60 rounded-full animate-spin" />
            <span className="text-[10px] uppercase tracking-widest font-black">Cargando...</span>
          </div>
        ) : visible.length === 0 ? (
          <div className="py-20 text-manso-cream/30 text-center">
            <p className="text-[10px] uppercase tracking-widest">Sin contenido en esta categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">
            {visible.map(item => {
              if (item.tipo === 'youtube') {
                const videoId = item.youtube_url ? getYouTubeId(item.youtube_url) : null;
                if (!videoId) return null;
                return <YouTubeEmbed key={item.id} videoId={videoId} titulo={item.titulo} />;
              }

              if (item.tipo === 'video' && item.archivo_url) {
                return <VideoEmbed key={item.id} src={item.archivo_url} titulo={item.titulo} />;
              }

              if (item.tipo === 'imagen' && item.archivo_url) {
                return <ImageCard key={item.id} src={item.archivo_url} titulo={item.titulo} />;
              }

              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
