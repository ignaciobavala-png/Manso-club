'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, Expand, Wifi, Clock } from 'lucide-react';
import { ParticleBackground } from '@/components/Home/ParticleBackground';

interface MediaItem {
  id: string;
  titulo: string;
  youtube_url?: string;
  archivo_url?: string;
  descripcion?: string;
  tipo: string;
  orden: number;
}

interface Transmision {
  id: string;
  titulo: string;
  slug: string;
  youtube_video_id: string | null;
  thumbnail_url: string | null;
  tipo: string;
  duracion_minutos: number | null;
  transmitido_en: string | null;
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
          <video src={src} controls className="w-full h-full" autoPlay />
        ) : (
          <>
            <video src={src} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" muted preload="metadata" />
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
          <img src={src} alt={titulo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Expand className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="mt-4 px-1">
          <h3 className="text-manso-cream font-black uppercase italic tracking-tighter text-xl leading-tight">{titulo}</h3>
        </div>
      </div>
      {expanded && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-10" onClick={() => setExpanded(false)}>
          <button onClick={() => setExpanded(false)} className="absolute top-6 right-6 text-white/60 hover:text-white text-2xl z-10">✕</button>
          <img src={src} alt={titulo} className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
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

export default function MultimediaClient({
  items,
  transmisiones,
  estaLogueado,
}: {
  items: MediaItem[];
  transmisiones: Transmision[];
  estaLogueado: boolean;
}) {
  const [filter, setFilter] = useState<FilterKey>('todo');

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

        {visible.length === 0 ? (
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

        {/* Sección transmisiones pasadas — solo para logueados */}
        {estaLogueado && (
          <div className="mt-24">
            <div className="w-full h-px bg-manso-cream/10 mb-14" />

            <div className="flex items-center gap-3 mb-10">
              <Wifi size={16} className="text-manso-terra" />
              <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter leading-none text-manso-cream">
                Transmisiones
              </h2>
            </div>

            {transmisiones.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[10px] uppercase tracking-widest text-manso-cream/25 font-black">
                  Aún no hay transmisiones archivadas
                </p>
                <p className="text-manso-cream/15 text-xs mt-2">
                  Las transmisiones en vivo aparecen aquí cuando terminan
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">
                {transmisiones.map(t => {
                  if (!t.youtube_video_id) return null;
                  return (
                    <div key={t.id} className="group">
                      <YouTubeEmbed videoId={t.youtube_video_id} titulo={t.titulo} />
                      <div className="mt-2 px-1 flex items-center gap-3">
                        {t.transmitido_en && (
                          <span className="text-[9px] text-manso-cream/30 uppercase tracking-widest font-black">
                            {new Date(t.transmitido_en).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        )}
                        {t.duracion_minutos && (
                          <span className="flex items-center gap-1 text-[9px] text-manso-cream/25 uppercase tracking-widest">
                            <Clock size={9} />
                            {t.duracion_minutos} min
                          </span>
                        )}
                        <Link
                          href={`/streaming/${t.slug}`}
                          className="ml-auto text-[9px] text-manso-terra/60 hover:text-manso-terra font-black uppercase tracking-widest transition-colors"
                        >
                          Ver en streaming →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Gate para no logueados — hint de que hay más */}
        {!estaLogueado && (
          <div className="mt-24 p-10 rounded-[30px] border border-manso-terra/15 bg-manso-terra/5 text-center">
            <Wifi size={28} className="text-manso-terra/40 mx-auto mb-4" />
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-manso-terra mb-3">
              Exclusivo para registrados
            </p>
            <p className="text-manso-cream font-black text-xl uppercase tracking-tight mb-2">
              Transmisiones anteriores
            </p>
            <p className="text-manso-cream/40 text-sm mb-6">
              Los usuarios registrados pueden ver todo lo que se transmitió en el canal
            </p>
            <Link
              href="/login?from=/multimedia"
              className="inline-block px-8 py-4 bg-manso-terra text-manso-cream rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95"
            >
              Ingresar / Registrarse
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
