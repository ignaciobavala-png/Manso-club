'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AYUDA, TITULO } from './festivalComun';

/**
 * Un bloque del panel de Festival, plegado detrás de un botón. El panel tiene
 * muchas secciones largas: agrupadas así, se abre solo lo que se va a tocar.
 * Arranca cerrado; el estado vive acá y no se guarda.
 */
export function FestivalGrupo({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="space-y-4">
      <button
        type="button"
        aria-expanded={abierto}
        onClick={() => setAbierto(v => !v)}
        className="w-full flex items-center justify-between gap-4 rounded-2xl border border-manso-cream/15 bg-manso-cream/[0.07] hover:bg-manso-cream/[0.12] px-4 py-3.5 text-left transition-colors"
      >
        <span className="min-w-0">
          <span className={`${TITULO} block`}>{titulo}</span>
          {descripcion && <span className={`${AYUDA} block`}>{descripcion}</span>}
        </span>
        <ChevronDown size={18} aria-hidden className={`shrink-0 text-manso-cream/70 transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>
      {abierto && <div className="space-y-10">{children}</div>}
    </div>
  );
}
