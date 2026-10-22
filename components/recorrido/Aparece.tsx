'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Entrada de un bloque al llegar a la pantalla: sube, se desenfoca y se aclara.
 * El estado oculto lo pinta el CSS desde el servidor, así que el árbol es el
 * mismo con o sin "reducir movimiento" (esa preferencia se resuelve con
 * `motion-reduce:` en CSS, no ramificando el render).
 */
export function Aparece({
  children,
  className = '',
  retraso = 0,
}: {
  children: ReactNode;
  className?: string;
  retraso?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.dataset.visto = 'true';
        io.disconnect();
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal
      style={retraso ? { transitionDelay: `${retraso}ms` } : undefined}
      className={`translate-y-16 opacity-0 blur-md transition-all duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)] data-[visto=true]:translate-y-0 data-[visto=true]:opacity-100 data-[visto=true]:blur-0 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:blur-0 motion-reduce:transition-none ${className}`}
    >
      {children}
    </div>
  );
}
