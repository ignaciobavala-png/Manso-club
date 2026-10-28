'use client';

import { createContext, useContext, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { COOKIE_IDIOMA, TEXTOS, type Idioma, type Textos } from '@/lib/festival-idioma';

const Contexto = createContext<Idioma>('es');

/** Lleva el idioma del servidor a los componentes de cliente de /blur. */
export function IdiomaProvider({ idioma, children }: { idioma: Idioma; children: React.ReactNode }) {
  // El `<html lang>` es del layout raíz de Manso, que es en castellano.
  useEffect(() => {
    document.documentElement.lang = idioma;
    return () => {
      document.documentElement.lang = 'es';
    };
  }, [idioma]);
  return <Contexto.Provider value={idioma}>{children}</Contexto.Provider>;
}

export const useIdioma = (): Idioma => useContext(Contexto);

export const useTextos = (): Textos => TEXTOS[useContext(Contexto)];

const guardarIdioma = (idioma: Idioma) => {
  document.cookie = `${COOKIE_IDIOMA}=${idioma}; path=/; max-age=31536000; samesite=lax`;
};

/**
 * ES | EN. Guarda la elección en una cookie y vuelve a pedir la página al
 * servidor, que es quien lee los textos.
 */
export function SelectorIdioma() {
  const idioma = useIdioma();
  const t = useTextos();
  const router = useRouter();
  const [pendiente, empezar] = useTransition();

  const elegir = (nuevo: Idioma) => {
    if (nuevo === idioma) return;
    guardarIdioma(nuevo);
    empezar(() => router.refresh());
  };

  return (
    <div
      role="group"
      aria-label={t.idiomaEtiqueta}
      aria-busy={pendiente}
      className="fest-menu flex items-center gap-[0.35em] text-[16px] sm:text-[18px] leading-none"
    >
      {(['es', 'en'] as const).map((l, i) => (
        <span key={l} className="flex items-center gap-[0.35em]">
          {i > 0 && <span aria-hidden className="opacity-40">/</span>}
          <button
            type="button"
            onClick={() => elegir(l)}
            aria-pressed={l === idioma}
            lang={l}
            className={`uppercase transition-colors ${
              l === idioma
                ? 'text-[var(--fest-texto)]'
                : 'text-[var(--fest-acento)] hover:text-[var(--fest-texto)]'
            }`}
          >
            {l}
          </button>
        </span>
      ))}
    </div>
  );
}
