'use client';

import { useRef, useState } from 'react';
import { useTextos } from '@/components/festival/Idioma';

/**
 * Formulario de /blurfestival/mis-entradas. La respuesta del servidor es la
 * misma haya o no compra, así que la pantalla de éxito nunca afirma que hubo
 * una: dice "si hay una compra con este mail…". Siempre ofrece WhatsApp, por si
 * compró con otro mail.
 */

const CAMPO =
  'w-full bg-transparent border border-[var(--fest-texto)]/40 focus:border-[var(--fest-texto)] focus:outline-none px-3 py-3.5 text-[16px] rounded-none placeholder:text-[var(--fest-texto)]/35 aria-[invalid=true]:border-[var(--fest-acento)] aria-[invalid=true]:border-2';
const BOTON =
  'fest-menu inline-flex items-center justify-center bg-[var(--fest-acento)] text-black px-8 py-4 text-[17px] disabled:opacity-60 min-h-[52px]';

type Estado = { fase: 'form' } | { fase: 'enviando' } | { fase: 'listo'; mail: string };
type Fallo = 'erroneo' | 'limite' | 'caido' | null;

export function MisEntradasForm({ whatsapp }: { whatsapp: string }) {
  const t = useTextos().misEntradas;
  const [mail, setMail] = useState('');
  const [estado, setEstado] = useState<Estado>({ fase: 'form' });
  const [fallo, setFallo] = useState<Fallo>(null);
  const campo = useRef<HTMLInputElement>(null);

  const wsp = `https://wa.me/${whatsapp}?text=${encodeURIComponent(t.wsp)}`;

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const limpio = mail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(limpio)) {
      setFallo('erroneo');
      campo.current?.focus();
      return;
    }
    // Se lee antes del await: después, `currentTarget` ya es null.
    const web = (e.currentTarget.elements.namedItem('web') as HTMLInputElement | null)?.value ?? '';
    setFallo(null);
    setEstado({ fase: 'enviando' });
    try {
      const r = await fetch('/api/festival/mis-entradas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mail: limpio, web }),
      });
      if (r.ok) return setEstado({ fase: 'listo', mail: limpio });
      setFallo(r.status === 429 ? 'limite' : r.status === 400 ? 'erroneo' : 'caido');
    } catch {
      setFallo('caido');
    }
    setEstado({ fase: 'form' });
  }

  if (estado.fase === 'listo') {
    return (
      <div role="status" aria-live="polite">
        <h1 className="fest-angosta text-4xl sm:text-5xl leading-none">{t.listoTitulo}</h1>
        <p className="mt-5 text-[16px] leading-relaxed">{t.listoTexto(estado.mail)}</p>
        <p className="mt-3 text-[14px] opacity-70">{t.listoLimite}</p>

        <div className="mt-10 border-t border-[var(--fest-texto)]/25 pt-6">
          <p className="fest-angosta text-2xl leading-none">{t.sinLlegar}</p>
          <p className="mt-3 text-[15px] opacity-80">{t.queHago}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={wsp} target="_blank" rel="noreferrer" className={BOTON}>
              {t.ayudaWsp}
            </a>
            <button type="button" onClick={() => setEstado({ fase: 'form' })} className="fest-menu px-6 py-4 border border-[var(--fest-texto)]/40 min-h-[52px]">
              {t.otroMail}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const mensaje = fallo ? t[fallo] : null;
  return (
    <form onSubmit={enviar} noValidate>
      <h1 className="fest-angosta text-4xl sm:text-5xl leading-none">{t.titulo}</h1>
      <p className="mt-5 text-[16px] leading-relaxed opacity-85">{t.intro}</p>

      <label htmlFor="mis-entradas-mail" className="block mt-8 fest-mono text-[11px] uppercase tracking-[0.2em] mb-2">
        {t.mail}
      </label>
      <input
        ref={campo}
        id="mis-entradas-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        required
        value={mail}
        onChange={e => {
          setMail(e.target.value);
          if (fallo === 'erroneo') setFallo(null);
        }}
        placeholder={t.placeholder}
        aria-invalid={fallo === 'erroneo'}
        aria-describedby={mensaje ? 'mis-entradas-error' : undefined}
        className={CAMPO}
      />
      {/* Honeypot: una persona no lo ve ni lo llena. */}
      <input name="web" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      {mensaje && (
        <p id="mis-entradas-error" role="alert" className="mt-2 text-[14px] font-bold text-[var(--fest-acento)]">
          {mensaje}
        </p>
      )}

      <button type="submit" disabled={estado.fase === 'enviando'} className={`${BOTON} mt-6 w-full sm:w-auto`}>
        {estado.fase === 'enviando' ? t.enviando : t.enviar}
      </button>

      <p className="mt-8 text-[14px] opacity-70">
        <a href={wsp} target="_blank" rel="noreferrer" className="underline">
          {t.ayudaWsp}
        </a>
      </p>
    </form>
  );
}
