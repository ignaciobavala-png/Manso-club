'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export interface BorradorIA {
  asunto: string;
  preheader: string;
  parrafos: string[];
  faltan: string[];
}

type Tono = 'cercano' | 'institucional' | 'entusiasta';

const TONOS: { id: Tono; label: string }[] = [
  { id: 'cercano', label: 'Cercano' },
  { id: 'institucional', label: 'Institucional' },
  { id: 'entusiasta', label: 'Entusiasta' },
];

/**
 * Panel de redacción con IA para una campaña de mailing. No guarda ni envía
 * nada: devuelve un borrador y la persona decide si lo usa.
 */
export function AsistenteRedaccion({ onAplicar }: { onAplicar: (borrador: BorradorIA) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [idea, setIdea] = useState('');
  const [tono, setTono] = useState<Tono>('cercano');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [borrador, setBorrador] = useState<BorradorIA | null>(null);

  const redactar = async () => {
    setCargando(true);
    setError(null);
    setBorrador(null);
    try {
      const res = await fetch('/api/admin/ia/mailing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, tono }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? 'No se pudo redactar.');
      setBorrador(data as BorradorIA);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo redactar.');
    } finally {
      setCargando(false);
    }
  };

  const usar = () => {
    if (!borrador) return;
    onAplicar(borrador);
    setBorrador(null);
    setIdea('');
    setAbierto(false);
  };

  return (
    <div className="rounded-2xl border border-manso-terra/30 bg-manso-terra/5">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        className="w-full flex items-center gap-2 px-4 py-3 text-left text-[14px] font-black uppercase tracking-widest text-manso-terra"
      >
        <Sparkles size={16} aria-hidden /> Redactar con IA
        <span className="ml-auto text-[12px] font-bold normal-case tracking-normal text-manso-cream/62">
          {abierto ? 'Cerrar' : 'Asunto, pre-header y texto a partir de una idea'}
        </span>
      </button>

      {abierto && (
        <div className="px-4 pb-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-[12px] font-black uppercase tracking-widest text-manso-cream/62">
              ¿Qué querés comunicar?
            </span>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={4}
              maxLength={1500}
              placeholder="Ej: Taller de cerámica el sábado 22 a las 16 hs, cupos limitados, se anotan por el sitio."
              className="w-full rounded-xl border border-manso-cream/10 bg-manso-cream/5 px-4 py-2.5 text-[15px] text-manso-cream placeholder:text-manso-cream/62 focus:outline-none focus:border-manso-terra"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <div role="radiogroup" aria-label="Tono" className="flex gap-1">
              {TONOS.map(t => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={tono === t.id}
                  onClick={() => setTono(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition-colors ${
                    tono === t.id ? 'bg-manso-cream text-manso-black' : 'bg-manso-cream/5 text-manso-cream/70 hover:bg-manso-cream/10'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={redactar}
              disabled={cargando || idea.trim().length < 10}
              className="ml-auto flex items-center gap-2 rounded-xl bg-manso-terra px-4 py-2 text-[13px] font-bold uppercase tracking-wider text-white disabled:opacity-40"
            >
              {cargando ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Sparkles size={14} aria-hidden />}
              {cargando ? 'Redactando…' : 'Redactar'}
            </button>
          </div>

          {error && <p role="alert" className="text-[14px] text-red-400">{error}</p>}

          {borrador && (
            <div className="space-y-3 rounded-xl border border-manso-cream/10 bg-manso-cream/5 p-4">
              <div>
                <p className="text-[12px] font-black uppercase tracking-widest text-manso-cream/62">Asunto</p>
                <p className="text-[15px] font-bold text-manso-cream">{borrador.asunto}</p>
              </div>
              <div>
                <p className="text-[12px] font-black uppercase tracking-widest text-manso-cream/62">Pre-header</p>
                <p className="text-[15px] text-manso-cream">{borrador.preheader}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[12px] font-black uppercase tracking-widest text-manso-cream/62">Texto</p>
                {borrador.parrafos.map((p, i) => (
                  <p key={i} className="text-[15px] leading-relaxed text-manso-cream">{p}</p>
                ))}
              </div>
              {borrador.faltan.length > 0 && (
                <p className="rounded-lg bg-yellow-400/10 px-3 py-2 text-[14px] text-yellow-400">
                  Falta completar a mano: {borrador.faltan.join(' · ')}. Está marcado como [COMPLETAR] en el texto.
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={usar}
                  className="rounded-xl bg-manso-cream px-4 py-2 text-[13px] font-bold uppercase tracking-wider text-manso-black"
                >
                  Usar en la campaña
                </button>
                <button
                  type="button"
                  onClick={redactar}
                  disabled={cargando}
                  className="rounded-xl border border-manso-cream/20 px-4 py-2 text-[13px] font-bold uppercase tracking-wider text-manso-cream/80 disabled:opacity-40"
                >
                  Otra versión
                </button>
              </div>
              <p className="text-[12px] text-manso-cream/62">
                Revisalo antes de enviar: la IA puede equivocarse. Usar el borrador reemplaza el asunto y el pre-header y suma los párrafos como bloques de texto.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
