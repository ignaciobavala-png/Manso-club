'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface Props {
  fotos: string[];
  alt: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Hace clickeables las fotos de adentro: cualquier elemento con
 * `data-foto={índice}` abre esa foto a pantalla completa, entera.
 *
 * Va por delegación (un solo onClick en el contenedor) para que las fotos
 * sigan armándose en el servidor: el mosaico de Locación calcula los
 * renglones allá y acá no hace falta saber nada de eso.
 *
 * En el visor: flechas o deslizar para pasar, Escape o tocar el fondo para
 * cerrar.
 */
export function VisorFotos({ fotos, alt, className, children }: Props) {
  const [abierta, setAbierta] = useState<number | null>(null);
  const toqueX = useRef<number | null>(null);

  const pasar = useCallback(
    (delta: number) => setAbierta(i => (i === null ? null : (i + delta + fotos.length) % fotos.length)),
    [fotos.length]
  );

  useEffect(() => {
    if (abierta === null) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierta(null);
      if (e.key === 'ArrowRight') pasar(1);
      if (e.key === 'ArrowLeft') pasar(-1);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', tecla);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', tecla);
    };
  }, [abierta, pasar]);

  const abrir = (e: React.MouseEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-foto]');
    if (el) setAbierta(Number(el.dataset.foto));
  };

  return (
    <>
      <div className={className} onClick={abrir}>
        {children}
      </div>

      {abierta !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setAbierta(null)}
          onTouchStart={e => (toqueX.current = e.touches[0].clientX)}
          onTouchEnd={e => {
            if (toqueX.current === null) return;
            const dx = e.changedTouches[0].clientX - toqueX.current;
            toqueX.current = null;
            if (Math.abs(dx) > 50) pasar(dx < 0 ? 1 : -1);
          }}
        >
          <div className="relative w-full h-full m-4 sm:m-12">
            <Image
              key={fotos[abierta]}
              src={fotos[abierta]}
              alt={alt}
              fill
              sizes="100vw"
              className="object-contain"
              onClick={e => e.stopPropagation()}
            />
          </div>

          <button
            type="button"
            onClick={() => setAbierta(null)}
            className="absolute top-3 right-4 fest-menu text-[var(--fest-texto)] text-[15px] p-2 hover:text-[var(--fest-acento)]"
          >
            Cerrar ✕
          </button>

          {fotos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Anterior"
                onClick={e => {
                  e.stopPropagation();
                  pasar(-1);
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 px-3 sm:px-5 py-8 fest-menu text-3xl text-[var(--fest-texto)] hover:text-[var(--fest-acento)]"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Siguiente"
                onClick={e => {
                  e.stopPropagation();
                  pasar(1);
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 px-3 sm:px-5 py-8 fest-menu text-3xl text-[var(--fest-texto)] hover:text-[var(--fest-acento)]"
              >
                ›
              </button>
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 fest-mono text-[11px] tracking-[0.3em] text-[var(--fest-texto)]/60">
                {abierta + 1} / {fotos.length}
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}
