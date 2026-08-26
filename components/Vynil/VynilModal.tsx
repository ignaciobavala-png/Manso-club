'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Link as LinkIcon, Trash2, Play } from 'lucide-react';
import { ShareButton } from '@/components/ShareButton';
import { supabase } from '@/lib/supabase';
import { useVynil } from '@/store/useVynil';
import {
  VYNIL_MAX_TEMAS,
  buscarMetadata,
  linkDeMix,
  parsearLink,
  thumbDeTema,
  type TemaVynil,
} from '@/lib/vynil';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Disco chico: el label es la portada del video. */
function Disco({ tema, girando = false }: { tema: TemaVynil; girando?: boolean }) {
  const thumb = thumbDeTema(tema);
  return (
    <span
      className={`relative block w-12 h-12 shrink-0 rounded-full ring-1 ring-black/60 overflow-hidden ${
        girando ? 'animate-[spin_3s_linear_infinite]' : ''
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
  );
}

export function VynilModal({ open, onClose }: Props) {
  const { temas, agregar, quitar, mixInvitado, autorInvitado, salirDeInvitado, setSonando, setIndice } =
    useVynil();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [publicado, setPublicado] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = previo;
      window.removeEventListener('keydown', onEsc);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const lleno = temas.length >= VYNIL_MAX_TEMAS;

  const cargar = async () => {
    const tema = parsearLink(url);
    if (!tema) {
      setError('Pegá un link de YouTube o de SoundCloud.');
      return;
    }
    if (temas.some(t => t.ref === tema.ref)) {
      setError('Ese tema ya está en tu bandeja.');
      return;
    }
    setError('');
    setCargando(true);
    // El título es un lujo, no un requisito: si el oEmbed falla, entra igual.
    const meta = await buscarMetadata(tema);
    agregar({ ...tema, ...meta });
    setUrl('');
    setCargando(false);
  };

  /**
   * Compartir es el momento en que la persona decide publicar, así que es
   * cuando se guarda para que Ana lo escuche. No se guarda mientras arma: eso
   * sería recolectar en silencio.
   */
  const publicar = async () => {
    if (publicado || temas.length === 0) return;
    setPublicado(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('vynil_mixes').insert({
      temas,
      user_id: user?.id ?? null,
      autor: user?.user_metadata?.display_name ?? null,
    });
  };

  const escuchar = (i: number) => {
    setIndice(i);
    setSonando(true);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] overflow-y-auto">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-sm" aria-hidden="true" />

      <div
        className="relative flex min-h-full items-center justify-center sm:p-8"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          onClick={e => e.stopPropagation()}
          className="relative w-full sm:max-w-lg bg-manso-black border border-manso-cream/15 sm:rounded-3xl min-h-screen sm:min-h-0 p-6 sm:p-8"
        >
          <div className="sticky top-4 z-10 flex justify-end h-0">
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-manso-black/70 backdrop-blur-sm text-manso-cream/40 hover:text-manso-cream hover:bg-manso-cream/10 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-[9px] font-black uppercase tracking-[0.6em] text-manso-terra mb-4">
            Manso · Vynil
          </p>
          <h2 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter leading-none text-manso-cream">
            Tu bandeja
          </h2>
          <p className="mt-4 text-manso-cream/50 text-sm font-light leading-relaxed">
            Hasta {VYNIL_MAX_TEMAS} temas de YouTube o SoundCloud. Suenan mientras recorrés Manso,
            y podés pasarle la lista a quien quieras. No hace falta tener cuenta.
          </p>

          {/* Si estás escuchando el mix de otro */}
          {mixInvitado && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-manso-terra/40 bg-manso-terra/10 px-4 py-3">
              <p className="text-[12px] text-manso-cream/70 font-light">
                Estás recorriendo Manso con la lista{autorInvitado ? ` de ${autorInvitado}` : ' de otra persona'}.
              </p>
              <button
                onClick={salirDeInvitado}
                className="text-[9px] font-black uppercase tracking-widest text-manso-terra hover:text-manso-cream transition-colors"
              >
                Volver a la mía
              </button>
            </div>
          )}

          {/* Cargar */}
          <div className="mt-7">
            <div
              className={`flex items-center gap-2 rounded-[10px] border bg-black/40 px-3 py-2.5 transition-colors ${
                lleno ? 'border-manso-cream/10 opacity-40' : 'border-manso-cream/20 focus-within:border-manso-terra'
              }`}
            >
              <LinkIcon size={15} className="text-manso-cream/30 shrink-0" />
              <input
                disabled={lleno}
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !cargando && cargar()}
                placeholder={lleno ? 'Bandeja llena' : 'Pegá un link de YouTube o SoundCloud'}
                className="flex-1 bg-transparent outline-none text-[13px] text-manso-cream placeholder:text-manso-cream/25 min-w-0"
              />
              <button
                onClick={cargar}
                disabled={lleno || cargando || !url.trim()}
                className="shrink-0 px-3 py-1.5 rounded-[6px] bg-manso-cream text-manso-black text-[11px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-25"
              >
                {cargando ? '...' : 'Poner'}
              </button>
            </div>
            {error && <p className="mt-2 text-[11.5px] text-manso-terra">{error}</p>}
            <p className="mt-2 text-[11px] text-manso-cream/25">
              {temas.length} de {VYNIL_MAX_TEMAS}
            </p>
          </div>

          {/* Lista */}
          <div className="mt-5 space-y-2">
            {temas.length === 0 ? (
              <p className="text-[12.5px] text-manso-cream/25 font-light text-center py-8">
                Tu bandeja está vacía.
              </p>
            ) : (
              temas.map((t, i) => (
                <div
                  key={t.ref}
                  className="group flex items-center gap-3 rounded-[12px] border border-manso-cream/10 p-3 hover:border-manso-cream/25 transition-colors"
                >
                  <Disco tema={t} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] text-manso-cream font-medium truncate">
                      {t.titulo ?? 'Tema sin título'}
                    </p>
                    <p className="text-[11px] text-manso-cream/35 truncate">
                      {t.autor ?? (t.fuente === 'youtube' ? 'YouTube' : 'SoundCloud')}
                    </p>
                  </div>
                  <button
                    onClick={() => escuchar(i)}
                    aria-label="Escuchar"
                    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-manso-cream/40 hover:text-manso-cream hover:bg-manso-cream/10 transition-colors"
                  >
                    <Play size={14} />
                  </button>
                  <button
                    onClick={() => quitar(t.ref)}
                    aria-label="Quitar"
                    className="shrink-0 text-manso-cream/20 hover:text-manso-terra transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Compartir */}
          {temas.length > 0 && (
            <div className="mt-7 pt-5 border-t border-manso-cream/10 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12px] text-manso-cream/35 font-light">
                Que recorran Manso con tu música.
              </p>
              <ShareButton
                title="Mi lista para recorrer Manso"
                text={`${temas.length} temas para recorrer Manso Club`}
                url={linkDeMix(temas, typeof window !== 'undefined' ? window.location.origin : '')}
                label="Compartir lista"
                onShare={publicar}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-manso-cream/20 text-manso-cream/60 hover:text-manso-cream hover:border-manso-cream/40 transition-colors"
              />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
