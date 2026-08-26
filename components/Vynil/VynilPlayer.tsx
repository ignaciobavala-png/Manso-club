'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Play, Pause, SkipBack, SkipForward, X } from 'lucide-react';
import { useVynil } from '@/store/useVynil';
import { decodificarMix, thumbDeTema, VYNIL_PARAM, type TemaVynil } from '@/lib/vynil';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Barra del mix de Vynil. Reproduce YouTube (IFrame API) y SoundCloud (Widget
 * API) — solo monta el iframe de la fuente del tema actual, para que nunca
 * suenen dos a la vez. Cuando esta barra está activa, GlobalMusicPlayer se
 * calla (lee el mismo store): un solo reproductor por vez.
 */
export function VynilPlayer() {
  const pathname = usePathname();
  const { indice, sonando, setSonando, siguiente, anterior, ponerInvitado, salirDeInvitado } =
    useVynil();
  const mixInvitado = useVynil(s => s.mixInvitado);
  const autorInvitado = useVynil(s => s.autorInvitado);
  const temas = useVynil(s => s.temas);

  const [listo, setListo] = useState(false);
  const ytRef = useRef<any>(null);
  const scRef = useRef<any>(null);
  const ytDivRef = useRef<HTMLDivElement>(null);
  const scIframeRef = useRef<HTMLIFrameElement>(null);

  const activo: TemaVynil[] = mixInvitado ?? temas;
  const actual = activo[indice];

  // ── Mix que llega por link ────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mix = decodificarMix(params.get(VYNIL_PARAM));
    if (mix.length > 0) {
      ponerInvitado(mix, params.get('de'));
    }
  }, [ponerInvitado]);

  // La barra tapa el pie: se compensa con padding mientras está montada.
  useEffect(() => {
    if (activo.length === 0) return;
    const previo = document.body.style.paddingBottom;
    document.body.style.paddingBottom = '58px';
    return () => { document.body.style.paddingBottom = previo; };
  }, [activo.length]);

  // ── YouTube ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (actual?.fuente !== 'youtube') return;

    const arrancar = () => {
      if (!ytDivRef.current || ytRef.current) return;
      ytRef.current = new (window as any).YT.Player(ytDivRef.current, {
        height: '0',
        width: '0',
        videoId: actual.ref,
        playerVars: { playsinline: 1 },
        events: {
          onReady: () => setListo(true),
          onStateChange: (e: any) => {
            const YT = (window as any).YT;
            if (e.data === YT.PlayerState.ENDED) siguiente();
            if (e.data === YT.PlayerState.PLAYING) setSonando(true);
            if (e.data === YT.PlayerState.PAUSED) setSonando(false);
          },
        },
      });
    };

    if ((window as any).YT?.Player) {
      arrancar();
      return;
    }

    const previo = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      previo?.();
      arrancar();
    };

    if (!document.getElementById('yt-iframe-api')) {
      const s = document.createElement('script');
      s.id = 'yt-iframe-api';
      s.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(s);
    }
  }, [actual?.fuente, actual?.ref, siguiente, setSonando]);

  // Cambio de tema dentro de YouTube
  useEffect(() => {
    if (actual?.fuente !== 'youtube' || !ytRef.current?.loadVideoById) return;
    if (sonando) ytRef.current.loadVideoById(actual.ref);
    else ytRef.current.cueVideoById(actual.ref);
  }, [actual?.ref, actual?.fuente, sonando]);

  // ── SoundCloud ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (actual?.fuente !== 'soundcloud' || !scIframeRef.current) return;
    if (!(window as any).SC?.Widget) return;

    const w = (window as any).SC.Widget(scIframeRef.current);
    scRef.current = w;
    const Events = (window as any).SC.Widget.Events;
    w.bind(Events.READY, () => {
      setListo(true);
      if (sonando) w.play();
    });
    w.bind(Events.FINISH, () => siguiente());
    w.bind(Events.PLAY, () => setSonando(true));
    w.bind(Events.PAUSE, () => setSonando(false));
  }, [actual?.fuente, actual?.ref, siguiente, setSonando, sonando]);

  // Un solo motor sonando: al cambiar de fuente, se apaga el otro.
  useEffect(() => {
    if (actual?.fuente === 'youtube') scRef.current?.pause?.();
    if (actual?.fuente === 'soundcloud') ytRef.current?.pauseVideo?.();
  }, [actual?.fuente]);

  if (!actual) return null;
  if (pathname?.startsWith('/mansoadm') || pathname?.startsWith('/login')) return null;

  const alternar = () => {
    if (actual.fuente === 'youtube') {
      const p = ytRef.current;
      if (!p) return;
      if (sonando) p.pauseVideo?.();
      else p.playVideo?.();
    } else {
      const w = scRef.current;
      if (!w) return;
      if (sonando) w.pause();
      else w.play();
    }
    setSonando(!sonando);
  };

  const thumb = thumbDeTema(actual);

  return (
    <>
      {/* Motores de audio, ocultos */}
      <div className="fixed -left-[9999px] top-0 w-0 h-0 overflow-hidden" aria-hidden="true">
        {actual.fuente === 'youtube' ? (
          <div ref={ytDivRef} />
        ) : (
          <iframe
            ref={scIframeRef}
            allow="autoplay"
            src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(
              `https://soundcloud.com/${actual.ref}`,
            )}&auto_play=false&hide_related=true&show_comments=false&show_user=false&visual=false`}
          />
        )}
      </div>

      {/* Barra */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-manso-black border-t border-manso-cream/10">
        <div className="max-w-6xl mx-auto px-3 sm:px-5 h-[58px] flex items-center gap-3">
          {/* Disco */}
          <span
            className={`relative block w-9 h-9 shrink-0 rounded-full ring-1 ring-black/60 overflow-hidden ${
              sonando ? 'animate-[spin_3s_linear_infinite]' : ''
            }`}
            style={{
              background:
                'repeating-radial-gradient(circle at 50% 50%, #121212 0 2px, #1c1c1c 2px 3px)',
            }}
          >
            {thumb ? (
              <img
                src={thumb}
                alt=""
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[44%] h-[44%] rounded-full object-cover"
              />
            ) : (
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[44%] h-[44%] rounded-full bg-manso-terra" />
            )}
          </span>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="text-manso-cream text-[11px] font-black uppercase tracking-wider truncate">
              {actual.titulo ?? 'Tu música'}
            </p>
            <p className="text-manso-cream/40 text-[9px] uppercase tracking-widest truncate">
              {mixInvitado
                ? `Lista${autorInvitado ? ` de ${autorInvitado}` : ' compartida'} · ${indice + 1}/${activo.length}`
                : `Tu lista · ${indice + 1}/${activo.length}`}
            </p>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={anterior}
              aria-label="Anterior"
              className="w-8 h-8 flex items-center justify-center text-manso-cream/40 hover:text-manso-cream transition-colors"
            >
              <SkipBack size={15} />
            </button>
            <button
              onClick={alternar}
              disabled={!listo}
              aria-label={sonando ? 'Pausar' : 'Reproducir'}
              className="w-9 h-9 rounded-full bg-manso-terra text-manso-cream flex items-center justify-center disabled:opacity-40 transition-opacity"
            >
              {sonando ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
            </button>
            <button
              onClick={siguiente}
              aria-label="Siguiente"
              className="w-8 h-8 flex items-center justify-center text-manso-cream/40 hover:text-manso-cream transition-colors"
            >
              <SkipForward size={15} />
            </button>
            {mixInvitado && (
              <button
                onClick={salirDeInvitado}
                aria-label="Salir de la lista compartida"
                title="Volver a la música de Manso"
                className="w-8 h-8 flex items-center justify-center text-manso-cream/25 hover:text-manso-cream transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
