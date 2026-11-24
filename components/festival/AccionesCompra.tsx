'use client';

import { useState } from 'react';
import { useTextos } from '@/components/festival/Idioma';

/**
 * Lo que la persona puede hacer con su compra pagada para no perder las
 * entradas: copiar o compartir el link (la llave de la orden) y un recordatorio
 * de guardar el QR antes de salir. El link es el que tiene que conservar si
 * pierde el mail.
 */
export function AccionesCompra() {
  const t = useTextos().compra;
  const [copiado, setCopiado] = useState(false);

  // Sin `?payment_id=…`: el link limpio es el que sirve para volver.
  const link = () => window.location.origin + window.location.pathname;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      window.prompt(t.copiarLink, link());
    }
  }

  return (
    <div className="mt-8 border border-[var(--fest-texto)]/25 p-5">
      <p className="fest-angosta text-2xl leading-none">{t.guardaTu}</p>
      <p className="mt-3 text-[14px] leading-relaxed opacity-80 max-w-[60ch]">{t.guardaTuTexto}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={copiar} className="fest-menu text-[14px] px-4 py-2.5 border border-[var(--fest-texto)]/40 min-h-[44px]">
          <span role="status">{copiado ? t.linkCopiado : t.copiarLink}</span>
        </button>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button type="button" onClick={() => navigator.share({ url: link() }).catch(() => {})} className="fest-menu text-[14px] px-4 py-2.5 border border-[var(--fest-texto)]/40 min-h-[44px]">
            {t.compartir}
          </button>
        )}
      </div>
    </div>
  );
}
