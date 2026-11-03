'use client';

import { useState } from 'react';
import { useTextos } from './Idioma';

/**
 * Guía "de pesos a USDT" para quien nunca usó cripto. Va cerrada en la
 * pantalla de pago: quien ya tiene USDT no la ve más que como un renglón.
 * Es genérica a propósito (no nombra botones de cada app, que cambian).
 */
export function GuiaUsdt() {
  const t = useTextos();
  const [abierta, setAbierta] = useState(false);
  const g = t.cripto.guia;

  return (
    <div className="mt-8 max-w-[620px]">
      <button
        type="button"
        onClick={() => setAbierta(a => !a)}
        aria-expanded={abierta}
        aria-controls="guia-usdt"
        className="fest-flecha fest-mono text-[12px] uppercase tracking-[0.2em] text-[var(--fest-resalte)] hover:opacity-80"
      >
        {abierta ? g.cerrar : g.abrir}
      </button>

      {abierta && (
        <div id="guia-usdt" className="mt-5 border border-[var(--fest-texto)]/25 px-5 py-6 sm:px-7">
          <h2 className="fest-angosta text-3xl leading-none">{g.titulo}</h2>
          <p className="mt-3 text-[14px] opacity-80 leading-snug">{g.intro}</p>

          <ol className="mt-6 grid gap-5">
            {g.pasos.map((paso, i) => (
              <li key={paso.titulo} className="grid grid-cols-[auto_1fr] gap-x-4">
                <span className="fest-mono text-[12px] text-[var(--fest-acento)] pt-1 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="fest-angosta text-xl leading-tight">{paso.titulo}</h3>
                  <p className="mt-1 text-[14px] opacity-75 leading-snug">{paso.texto}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-6 pt-4 border-t border-[var(--fest-texto)]/15 text-[13px] opacity-70 leading-snug">
            {g.consejo}
          </p>
        </div>
      )}
    </div>
  );
}
