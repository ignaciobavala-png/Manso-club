'use client';

import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Título de una sola línea que ocupa exacto el ancho de su caja. La caja se
 * limita al ancho del párrafo de al lado (`max-w-[62ch]` con la misma
 * tipografía), así que el nombre llena lo mismo que la bio.
 *
 * La medida sale de un span oculto a tamaño fijo (100px) y se escala de forma
 * lineal: no depende del tamaño actual, así que no hay bucle al redimensionar.
 * Antes de medir, el título usa la clase de fallback (`className`).
 */
export function TituloAncho({ texto, className }: { texto: string; className?: string }) {
  const caja = useRef<HTMLDivElement>(null);
  const medida = useRef<HTMLSpanElement>(null);
  const [tam, setTam] = useState<number | null>(null);

  useLayoutEffect(() => {
    const ajustar = () => {
      const c = caja.current;
      const m = medida.current;
      if (!c || !m) return;
      const ancho = m.getBoundingClientRect().width;
      if (ancho > 0 && c.clientWidth > 0) setTam((100 * c.clientWidth) / ancho);
    };
    ajustar();
    const ro = new ResizeObserver(ajustar);
    if (caja.current) ro.observe(caja.current);
    document.fonts?.ready.then(ajustar);
    return () => ro.disconnect();
  }, [texto]);

  return (
    <div
      ref={caja}
      className="relative w-full max-w-[62ch] text-[clamp(17px,1.5vw,21px)]"
    >
      <h1
        className={`fest-ancha leading-[0.88] whitespace-nowrap ${className ?? ''}`}
        style={tam ? { fontSize: `${tam}px` } : undefined}
      >
        {texto}
      </h1>
      <span
        ref={medida}
        aria-hidden
        className="fest-ancha leading-[0.88] whitespace-nowrap absolute left-0 top-0 invisible pointer-events-none"
        style={{ fontSize: '100px' }}
      >
        {texto}
      </span>
    </div>
  );
}
