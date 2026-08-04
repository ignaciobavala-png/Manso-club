'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, Lock, Wifi, Clock, PowerOff, Users } from 'lucide-react';

type Nivel = 'publico' | 'registrado' | 'miembro';

type Contenido = {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string | null;
  tipo: string;
  thumbnail_url: string | null;
  is_live: boolean;
  scheduled_at: string | null;
  duracion_minutos: number | null;

  curso_id: string | null;
  orden: number;
  visibilidad: string;
};

type Categoria = {
  slug: string;
  nombre: string;
  color: string;
};

type CanalContenido = {
  id: string;
  titulo: string;
  youtube_video_id: string | null;
  thumbnail_url: string | null;
} | null;

type Canal = {
  modo: 'en_vivo' | 'grabado' | 'apagado';
  streamUrl: string | null;
  contenido: CanalContenido;
};

type Props = {
  contenido: Contenido[];
  categorias: Categoria[];
  nivel: Nivel;
  canal: Canal;
};

function getYouTubeEmbedUrl(url: string): string | null {
  // Soporta youtube.com/live/ID, youtu.be/ID, youtube.com/watch?v=ID
  const patterns = [
    /youtube\.com\/live\/([^?&/\s]+)/,
    /youtu\.be\/([^?&/\s]+)/,
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtube\.com\/embed\/([^?&/\s]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&modestbranding=1&rel=0`;
  }
  return null;
}

/**
 * Ancho máximo del player para que entre entero en la pantalla.
 *
 * Se capea el ANCHO y no el alto: sobre un contenedor `aspect-video`, un
 * `max-height` recorta el alto pero deja el ancho al 100%, así que se rompe la
 * relación de aspecto y el video queda con bandas negras. Limitando el ancho
 * contra el alto disponible, el 16:9 se mantiene y la caja entra sola.
 *
 * Las 15rem son lo que ocupa todo lo que no es el player en el primer viewport:
 * el `pt-32` de la página (8rem), el badge de estado con su margen (~4rem) y un
 * resto para que se asome el contenido de abajo y se note que hay scroll.
 *
 * `svh` y no `vh`: en el celular `vh` usa la altura CON la barra de URL
 * retraída, así que al cargar (barra visible) el player queda más alto que la
 * pantalla. `svh` toma siempre la medida chica y no salta al scrollear.
 */
const ANCHO_MAX_PLAYER = 'calc((100svh - 15rem) * 16 / 9)';

function CanalPlayer({ canal, nivel }: { canal: Canal; nivel: Nivel }) {
  const [playing, setPlaying] = useState(false);

  // El canal siempre es visible si hay transmisión activa: los no logueados
  // ven el stream igual, con un CTA no bloqueante.

  if (canal.modo === 'apagado') {
    return (
      <div
        className="mb-10 md:mb-14 mx-auto w-full rounded-[28px] border border-manso-cream/10 bg-manso-cream/5 flex items-center justify-center aspect-video"
        style={{ maxWidth: ANCHO_MAX_PLAYER }}
      >
        <div className="text-center px-8">
          <PowerOff size={36} className="text-manso-cream/15 mx-auto mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-manso-cream/25">
            Canal sin transmisión activa
          </p>
        </div>
      </div>
    );
  }

  const isLive = canal.modo === 'en_vivo';

  // Determinar la fuente del embed
  let embedSrc: string | null = null;
  let thumbnailUrl: string | null = null;
  let titulo = '';

  if (isLive && canal.streamUrl) {
    embedSrc = getYouTubeEmbedUrl(canal.streamUrl);
    titulo = 'En vivo';
  } else if (canal.modo === 'grabado' && canal.contenido) {
    if (canal.contenido.youtube_video_id) {
      const patterns = [
        /youtube\.com\/live\/([^?&/\s]+)/,
        /youtu\.be\/([^?&/\s]+)/,
        /youtube\.com\/watch\?v=([^&\s]+)/,
        /youtube\.com\/embed\/([^?&/\s]+)/,
      ];
      let videoId = canal.contenido.youtube_video_id;
      for (const p of patterns) {
        const m = videoId.match(p);
        if (m) { videoId = m[1]; break; }
      }
      embedSrc = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&loop=1&playlist=${videoId}`;
    }
    thumbnailUrl = canal.contenido.thumbnail_url;
    titulo = canal.contenido.titulo;
  }

  return (
    <div className="mb-10 md:mb-14 mx-auto w-full relative" style={{ maxWidth: ANCHO_MAX_PLAYER }}>
      {/* Player */}
      <div className="relative aspect-video rounded-[20px] overflow-hidden bg-zinc-900 border border-manso-cream/10">
        {embedSrc ? (
          // Live: carga el iframe directamente sin overlay
          isLive ? (
            <iframe
              src={embedSrc}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          ) : playing ? (
            <iframe
              src={embedSrc}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          ) : (
            <>
              {thumbnailUrl && (
                <img src={thumbnailUrl} alt={titulo} className="absolute inset-0 w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <button
                  onClick={() => setPlaying(true)}
                  className="w-16 h-16 rounded-full bg-manso-terra/90 hover:bg-manso-terra flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                >
                  <Play size={22} className="text-white fill-white ml-1" />
                </button>
              </div>
            </>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-manso-cream/30 text-xs uppercase tracking-widest font-black">
              Sin URL de stream configurada
            </p>
          </div>
        )}

      </div>

      {/* Banner no bloqueante para usuarios no logueados.
          En el celular va DEBAJO del player y no encima: sobre un video de
          ~190px de alto, una barra de 3 renglones tapa los controles de
          YouTube (play, barra de tiempo, pantalla completa) y deja el video
          sin manejar. En desktop, con el player grande, sigue superpuesto. */}
      {nivel === 'publico' && (
        <div className="mt-2 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-black/70 border border-manso-cream/10 md:mt-0 md:absolute md:bottom-0 md:inset-x-0 md:rounded-none md:rounded-b-[20px] md:border-0 md:border-t md:px-5 md:backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Users size={13} className="text-blue-400 shrink-0" />
            <p className="text-[9px] font-black uppercase tracking-widest text-manso-cream/70">
              Registrate gratis para acceder a más contenido
            </p>
          </div>
          <Link
            href="/login?from=/streaming"
            className="shrink-0 px-4 py-1.5 bg-manso-blue text-manso-cream rounded-full text-[8px] font-black uppercase tracking-widest hover:bg-manso-blue/80 transition-all"
          >
            Ingresar
          </Link>
        </div>
      )}
    </div>
  );
}

export default function StreamingLibrary({ contenido, categorias, nivel, canal }: Props) {
  const [filtro, setFiltro] = useState<string>('todo');

  const colorMap = Object.fromEntries(categorias.map(c => [c.slug, c.color]));

  const canalBadge = canal.modo === 'en_vivo'
    ? <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-[9px] font-black uppercase tracking-[0.3em]"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /><Wifi size={9} />En vivo</span>
    : canal.modo === 'grabado'
    ? <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-manso-olive/15 border border-manso-olive/30 text-manso-olive text-[9px] font-black uppercase tracking-[0.3em]"><Play size={9} />Grabado</span>
    : null;

  const tieneAcceso = (item: Contenido) => {
    if (nivel === 'miembro') return true;
    if (nivel === 'registrado') return item.visibilidad !== 'miembro';
    return item.visibilidad === 'publico';
  };

  const filtrados = filtro === 'todo'
    ? contenido
    : contenido.filter(c => c.tipo === filtro);

  const hayOcultos = nivel !== 'miembro' && contenido.some(c => !tieneAcceso(c));

  return (
    <div>
      {/* Header integrado con estado del canal */}
      {canalBadge && <div className="mb-8">{canalBadge}</div>}

      {/* Canal en vivo / grabado */}
      <CanalPlayer canal={canal} nivel={nivel} />

      {/* Badge membresía si la tiene */}
      {nivel === 'miembro' && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-manso-terra/20 border border-manso-terra/30 mb-8">
          <span className="w-2 h-2 rounded-full bg-manso-terra animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-manso-terra">
            Acceso completo con membresía
          </span>
        </div>
      )}

      {/* Filtros de categoría */}
      {contenido.length > 0 && (
        <div className="flex gap-2 mb-10 flex-wrap">
          <button
            onClick={() => setFiltro('todo')}
            className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
              filtro === 'todo'
                ? 'bg-manso-cream text-manso-black'
                : 'border border-manso-cream/20 text-manso-cream/50 hover:border-manso-cream/50 hover:text-manso-cream'
            }`}
          >
            Todo
          </button>
          {categorias.map(cat => (
            <button
              key={cat.slug}
              onClick={() => setFiltro(cat.slug)}
              className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                filtro === cat.slug
                  ? 'bg-manso-cream text-manso-black'
                  : 'border border-manso-cream/20 text-manso-cream/50 hover:border-manso-cream/50 hover:text-manso-cream'
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Grid de contenido */}
      {filtrados.length === 0 ? null : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrados.map((item) => {
            const acceso = tieneAcceso(item);

            return (
              <Link
                key={item.id}
                href={acceso ? `/streaming/${item.slug}` : nivel === 'publico' ? '/login?from=/streaming' : '/membresias'}
                className="group flex flex-col rounded-[24px] overflow-hidden border border-manso-cream/10 bg-manso-cream/5 hover:bg-manso-cream/10 hover:border-manso-cream/20 transition-all duration-500"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-zinc-900 overflow-hidden">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                      <Play size={32} className="text-manso-cream/10" />
                    </div>
                  )}

                  {/* Overlay play */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${acceso ? 'bg-manso-terra' : 'bg-white/20'}`}>
                      {acceso ? <Play size={18} className="text-white fill-white ml-1" /> : <Lock size={16} className="text-white" />}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {item.is_live && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-600 text-white text-[8px] font-black uppercase tracking-widest">
                        <Wifi size={8} />
                        Live
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${colorMap[item.tipo] ?? 'bg-zinc-700 text-white'}`}>
                      {categorias.find(c => c.slug === item.tipo)?.nombre ?? item.tipo}
                    </span>
                  </div>

                  {/* Lock si no tiene acceso */}
                  {!acceso && (
                    <div className="absolute top-3 right-3">
                      <span className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center">
                        <Lock size={12} className="text-white" />
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-manso-cream font-black uppercase tracking-tight leading-tight mb-2 line-clamp-2">
                    {item.titulo}
                  </h3>

                  {item.descripcion && (
                    <p className="text-manso-cream/40 text-xs leading-relaxed mb-3 line-clamp-2">
                      {item.descripcion}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between">
                    {item.duracion_minutos && (
                      <span className="flex items-center gap-1 text-[9px] text-manso-cream/30 uppercase tracking-widest">
                        <Clock size={10} />
                        {item.duracion_minutos} min
                      </span>
                    )}
                    <div className="ml-auto">
                      {acceso ? (
                        <span className="text-[9px] font-black uppercase tracking-widest text-manso-terra">
                          ✓ Tenés acceso
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/50">
                          {nivel === 'publico' ? 'Requiere registro' : 'Solo membresía'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Gate de upgrade */}
      {hayOcultos && nivel === 'registrado' && (
        <div className="mt-16 p-8 rounded-[30px] border border-manso-terra/20 bg-manso-terra/5 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-manso-terra mb-3">
            Más contenido disponible
          </p>
          <p className="text-manso-cream font-black text-xl uppercase tracking-tight mb-2">
            Desbloqueá todo con membresía
          </p>
          <p className="text-manso-cream/40 text-sm mb-6">
            Los miembros acceden a conciertos y cursos exclusivos
          </p>
          <Link
            href="/membresias"
            className="inline-block px-8 py-4 bg-manso-terra text-manso-cream rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95"
          >
            Ver membresías
          </Link>
        </div>
      )}

      {hayOcultos && nivel === 'publico' && (
        <div className="mt-16 p-8 rounded-[30px] border border-manso-blue/20 bg-manso-blue/5 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-blue-400 mb-3">
            Acceso gratuito
          </p>
          <p className="text-manso-cream font-black text-xl uppercase tracking-tight mb-2">
            Registrate para ver más
          </p>
          <p className="text-manso-cream/40 text-sm mb-6">
            Los usuarios registrados tienen acceso a contenido exclusivo
          </p>
          <Link
            href="/login?from=/streaming"
            className="inline-block px-8 py-4 bg-manso-blue text-manso-cream rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95"
          >
            Ingresar / Registrarse
          </Link>
        </div>
      )}
    </div>
  );
}
