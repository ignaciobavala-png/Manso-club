'use client';

import { useEffect, useRef } from 'react';

/**
 * Frase que se va "encendiendo" palabra por palabra al pasar por una línea
 * a ~60% de la pantalla. Un IntersectionObserver por bloque, sin listener de
 * scroll. Se enciende y se apaga, así que al volver para arriba se desanda.
 */
export function TextoPalabras({ texto, className = '' }: { texto: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const raiz = ref.current;
    if (!raiz) return;
    const palabras = raiz.querySelectorAll<HTMLElement>('[data-palabra]');
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          const el = e.target as HTMLElement;
          // Pasó la línea de disparo: está dentro de la banda o ya subió por encima.
          const encendida = e.isIntersecting || e.boundingClientRect.top < 0;
          el.dataset.on = encendida ? 'true' : 'false';
        }
      },
      { rootMargin: '0px 0px -40% 0px' },
    );
    palabras.forEach((p) => io.observe(p));
    return () => io.disconnect();
  }, []);

  return (
    <p ref={ref} className={className}>
      {texto.split(' ').map((p, i) => (
        <span
          key={i}
          data-palabra
          className="text-manso-cream/30 transition-colors duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] data-[on=true]:text-manso-cream motion-reduce:text-manso-cream"
        >
          {p}{' '}
        </span>
      ))}
    </p>
  );
}
