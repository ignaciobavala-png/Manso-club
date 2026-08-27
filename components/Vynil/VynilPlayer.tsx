'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useVynil } from '@/store/useVynil';
import { VynilDisco } from './VynilDisco';
import { VynilPanel } from './VynilPanel';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Vynil — el reproductor de Manso. No hay barra al pie: el widget tiene la
 * forma del disco. Flota en la esquina girando mientras suena y, al tocarlo,
 * crece en un panel con la bandeja, los controles y la playlist general.
 *
 * Reproduce YouTube (IFrame API) y SoundCloud (Widget API), y monta un solo
 * iframe por vez —el de la fuente del tema actual— para que nunca suenen dos.
 */
export function VynilPlayer() {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const { indice, sonando, setSonando, siguiente, cargar } = useVynil();
  const temas = useVynil(s => s.temas);
  const cargado = useVynil(s => s.cargado);

  // El link que se comparte (`/?vynil=1`) cae acá con el reproductor abierto.
  // No arranca solo a propósito: el navegador bloquea el audio sin gesto, así
  // que quedaría el disco "girando" sin sonar. Se abre y la persona toca play.
  const [abierto, setAbierto] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('vynil'),
  );
  const [listo, setListo] = useState(false);
  const ytRef = useRef<any>(null);
  const scRef = useRef<any>(null);
  const ytDivRef = useRef<HTMLDivElement>(null);
  const scIframeRef = useRef<HTMLIFrameElement>(null);

  const actual = temas[indice];

  // ── La playlist general ───────────────────────────────────────────────────
  useEffect(() => {
    cargar();
  }, [cargar]);

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

  if (!cargado) return null;
  if (
    pathname?.startsWith('/mansoadm') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/registro')
  ) {
    return null;
  }

  const alternar = () => {
    if (!actual) return;
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

  // Mismas condiciones que CalendarioFab y WhatsAppButton, para apilarse bien.
  const whatsappVisible = !loading && !user && !pathname?.startsWith('/foro');
  const calendarioVisible = !pathname?.startsWith('/calendario');
  const bottom = calendarioVisible
    ? whatsappVisible
      ? 'bottom-[12.5rem]'
      : 'bottom-28'
    : whatsappVisible
      ? 'bottom-28'
      : 'bottom-6';

  return (
    <>
      {/* Motores de audio, ocultos */}
      {actual && (
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
      )}

      {/* El disco flotante: el reproductor cerrado */}
      {!abierto && (
        <div className={`fixed right-4 z-50 ${bottom}`}>
          <button
            onClick={() => setAbierto(true)}
            aria-label="Vinyl — la música que suena en Manso"
            className="group flex items-center justify-center relative"
          >
            <span className="absolute right-20 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-sm opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap translate-x-4 group-hover:translate-x-0">
              Vinyl_
            </span>

            <VynilDisco
              tema={actual}
              tamano={60}
              girando={sonando}
              className="shadow-[0_10px_20px_rgba(0,0,0,0.45)] transition-transform duration-500 group-hover:scale-110"
            />

            {temas.length > 0 && (
              <span className="absolute -top-1 -left-1 min-w-[20px] h-5 px-1 rounded-full bg-manso-cream text-manso-black text-[10px] font-black flex items-center justify-center ring-2 ring-manso-black">
                {temas.length}
              </span>
            )}
          </button>
        </div>
      )}

      <VynilPanel
        open={abierto}
        onClose={() => setAbierto(false)}
        listo={listo}
        alternar={alternar}
      />
    </>
  );
}
