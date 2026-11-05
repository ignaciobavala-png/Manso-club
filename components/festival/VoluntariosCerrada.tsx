'use client';

import { useRef, useState } from 'react';
import { useIdioma } from '@/components/festival/Idioma';
import { TEXTOS_VOLUNTARIOS } from '@/lib/festival-voluntarios-textos';

/**
 * Lo que reemplaza al formulario cuando la convocatoria cerró (apagada a mano
 * o pasada la fecha): un solo campo, el mail para la próxima edición.
 */
export function VoluntariosCerrada() {
  const idioma = useIdioma();
  const t = TEXTOS_VOLUNTARIOS[idioma].cerrada;
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState<'libre' | 'enviando' | 'ok' | 'error'>('libre');
  const [cargadoEn] = useState(() => Date.now());
  const trampa = useRef<HTMLInputElement>(null);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (estado === 'enviando') return;
    setEstado('enviando');
    try {
      const res = await fetch('/api/festival/voluntarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modo: 'aviso',
          email,
          ms: Date.now() - cargadoEn,
          sitio_web: trampa.current?.value ?? '',
        }),
      });
      setEstado(res.ok ? 'ok' : 'error');
    } catch {
      setEstado('error');
    }
  };

  if (estado === 'ok') {
    return (
      <p role="status" className="text-[18px] font-bold">
        {t.ok}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-[18px] leading-[1.4]">{t.texto}</p>
      <form onSubmit={enviar} className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <input ref={trampa} type="text" name="sitio_web" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>
        <div className="flex-1">
          <label htmlFor="vol-aviso" className="block fest-mono text-[11px] uppercase tracking-[0.2em] mb-2">
            {t.email}
          </label>
          <input
            id="vol-aviso"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            aria-invalid={estado === 'error' ? true : undefined}
            className="w-full bg-transparent border border-[var(--fest-texto)]/40 focus:border-[var(--fest-texto)] focus:outline-none px-3 py-3 text-[16px] rounded-none"
          />
        </div>
        <button
          type="submit"
          disabled={estado === 'enviando'}
          className="fest-menu text-[19px] bg-[var(--fest-acento)] text-[var(--fest-fondo)] hover:bg-[var(--fest-texto)] transition-colors px-6 py-3 disabled:opacity-50"
        >
          {t.enviar}
        </button>
      </form>
      {estado === 'error' && (
        <p role="alert" className="text-[13px] font-bold text-[var(--fest-acento)]">
          {t.error}
        </p>
      )}
    </div>
  );
}
