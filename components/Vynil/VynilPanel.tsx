'use client';

import { useEffect, useState } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Link as LinkIcon } from 'lucide-react';
import { ShareButton } from '@/components/ShareButton';
import { useVynil } from '@/store/useVynil';
import { VynilDisco } from './VynilDisco';

/**
 * Diámetro del plato. Va atado a la altura de la ventana para que en un mobile
 * bajo el disco ceda espacio y la lista siga teniendo dónde scrollear.
 */
const PLATO = 'clamp(120px, 26vh, 210px)';

interface Props {
  open: boolean;
  onClose: () => void;
  /** El motor de audio ya está listo para recibir play/pause. */
  listo: boolean;
  alternar: () => void;
}

/**
 * El reproductor abierto: la bandeja con el disco girando, los controles y la
 * playlist general de Manso. No es un modal a pantalla completa — el disco
 * crece desde donde estaba flotando y la página se sigue viendo detrás.
 */
export function VynilPanel({ open, onClose, listo, alternar }: Props) {
  const { temas, indice, sonando, siguiente, anterior, setIndice, setSonando, poner } = useVynil();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;

  const actual = temas[indice];

  const enviar = async () => {
    if (!url.trim() || cargando) return;
    setCargando(true);
    const r = await poner(url);
    setCargando(false);
    setError(r.error ?? '');
    if (r.ok || !r.error?.startsWith('Pegá')) setUrl('');
  };

  const escuchar = (i: number) => {
    setIndice(i);
    setSonando(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Vinyl — la playlist de Manso"
      className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[380px] z-[60] flex flex-col max-h-[85dvh] overflow-y-auto overscroll-contain rounded-[28px] border border-manso-cream/15 bg-manso-black/95 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
    >
      {/* Cabecera. Sticky porque ahora el contenedor scrollea y el botón de
          cerrar tiene que quedar siempre a mano. */}
      <div className="sticky top-0 z-20 flex items-start justify-between gap-3 px-5 pt-5 pb-2 bg-manso-black/95 backdrop-blur-md">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-manso-terra">
          Manso · Vinyl
        </p>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="-mt-1 w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-manso-cream/40 hover:text-manso-cream hover:bg-manso-cream/10 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Bandeja. El plato se achica con la pantalla: en un mobile bajo, 210px
          fijos dejaban la lista sin lugar para scrollear. */}
      <div className="px-5 pb-5 shrink-0">
        <div className="relative mx-auto" style={{ width: PLATO, height: PLATO }}>
          <VynilDisco
            tema={actual}
            tamano={PLATO}
            girando={sonando}
            vuelta={6}
            className="shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          />
          {/* Púa: baja sobre el disco cuando suena */}
          <span
            className="absolute -top-1 right-1 origin-top-right transition-transform duration-700 pointer-events-none"
            style={{ transform: `rotate(${sonando ? 26 : 0}deg)` }}
            aria-hidden="true"
          >
            <span className="block w-2.5 h-2.5 rounded-full bg-manso-cream/70 ring-2 ring-manso-black" />
            <span
              className="block w-[3px] ml-[4px] bg-gradient-to-b from-manso-cream/70 to-manso-cream/25 rounded-full"
              style={{ height: `calc(${PLATO} * 0.41)` }}
            />
          </span>
        </div>

        {/* Tema actual */}
        <div className="mt-4 text-center min-h-[46px]">
          <p className="text-manso-cream text-[13px] font-black uppercase tracking-wide leading-tight line-clamp-2">
            {actual?.titulo ?? 'Poné el primer tema'}
          </p>
          <p className="mt-1 text-manso-cream/40 text-[10px] uppercase tracking-[0.25em] truncate">
            {actual
              ? actual.puestoPor
                ? `Lo puso ${actual.puestoPor}`
                : (actual.autor ?? (actual.fuente === 'youtube' ? 'YouTube' : 'SoundCloud'))
              : 'La playlist está vacía'}
          </p>
        </div>

        {/* Controles */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            onClick={anterior}
            disabled={temas.length === 0}
            aria-label="Anterior"
            className="w-9 h-9 flex items-center justify-center text-manso-cream/40 hover:text-manso-cream disabled:opacity-20 transition-colors"
          >
            <SkipBack size={17} />
          </button>
          <button
            onClick={alternar}
            disabled={!listo || temas.length === 0}
            aria-label={sonando ? 'Pausar' : 'Reproducir'}
            className="w-14 h-14 rounded-full bg-manso-terra text-manso-cream flex items-center justify-center disabled:opacity-30 hover:scale-105 transition-transform"
          >
            {sonando ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>
          <button
            onClick={siguiente}
            disabled={temas.length === 0}
            aria-label="Siguiente"
            className="w-9 h-9 flex items-center justify-center text-manso-cream/40 hover:text-manso-cream disabled:opacity-20 transition-colors"
          >
            <SkipForward size={17} />
          </button>
        </div>

        {/* Compartir el reproductor, no la lista: el link abre Vynil sonando */}
        <div className="mt-4 flex justify-center">
          <ShareButton
            title="Vinyl — la música que suena en Manso"
            url="/?vynil=1"
            label="Compartir el reproductor"
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-manso-cream/15 text-manso-cream/50 hover:text-manso-cream hover:border-manso-cream/35 transition-colors"
          />
        </div>
      </div>

      {/* Compartir un tema con la playlist */}
      <div className="px-5 shrink-0">
        <div className="flex items-center gap-2 rounded-[10px] border border-manso-cream/20 bg-black/40 px-3 py-2.5 focus-within:border-manso-terra transition-colors">
          <LinkIcon size={15} className="text-manso-cream/30 shrink-0" />
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && enviar()}
            placeholder="Pegá un link de YouTube o SoundCloud"
            className="flex-1 bg-transparent outline-none text-[13px] text-manso-cream placeholder:text-manso-cream/25 min-w-0"
          />
          <button
            onClick={enviar}
            disabled={cargando || !url.trim()}
            className="shrink-0 px-3 py-1.5 rounded-[6px] bg-manso-cream text-manso-black text-[11px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-25"
          >
            {cargando ? '...' : 'Compartir'}
          </button>
        </div>
        {error && <p className="mt-2 text-[11.5px] text-manso-terra">{error}</p>}
      </div>

      {/* La playlist */}
      {/* Dos scrolls, a propósito: la lista scrollea adentro de su alto y,
          cuando llega al final, el gesto sigue en el contenedor. Sin
          `overscroll-contain` acá para que esa cadena funcione — el que
          corta la cadena hacia la página es el contenedor de afuera. */}
      <div className="mt-4 shrink-0 max-h-[45dvh] overflow-y-auto px-5 pb-5">
        <p className="sticky top-0 z-10 -mx-1 px-1 pb-3 bg-manso-black text-[9px] font-black uppercase tracking-[0.35em] text-manso-cream/25">
          {temas.length === 0
            ? 'Todavía no hay nada'
            : `${temas.length} ${temas.length === 1 ? 'tema puesto' : 'temas puestos'} por la gente`}
        </p>

        <div className="space-y-1">
          {temas.map((t, i) => (
            <button
              key={t.id ?? t.ref}
              onClick={() => escuchar(i)}
              className={`w-full flex items-center gap-3 rounded-[10px] px-2 py-2 text-left transition-colors ${
                i === indice ? 'bg-manso-cream/10' : 'hover:bg-manso-cream/5'
              }`}
            >
              <VynilDisco tema={t} tamano={34} girando={i === indice && sonando} />
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-[12.5px] truncate ${
                    i === indice ? 'text-manso-cream font-medium' : 'text-manso-cream/70'
                  }`}
                >
                  {t.titulo ?? 'Tema sin título'}
                </span>
                <span className="block text-[10.5px] text-manso-cream/30 truncate">
                  {t.puestoPor ?? t.autor ?? (t.fuente === 'youtube' ? 'YouTube' : 'SoundCloud')}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
