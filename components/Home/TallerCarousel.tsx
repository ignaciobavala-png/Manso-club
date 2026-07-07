'use client';

import { useRef, useState, useEffect } from 'react';

interface Foto {
  id: string;
  url: string;
}

const MS_PER_ITEM = 3500; // tiempo que tarda en recorrer un "slot" completo

export function TallerCarousel({ fotos }: { fotos: Foto[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const [active, setActive] = useState(0);
  const n = fotos.length;
  const indexRef = useRef(n); // posición continua (float) dentro de la copia del medio

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    indexRef.current = n;
  }, [n]);

  const itemWidth = containerWidth / 3.4;

  // Loop de animación continuo (sin saltos ni pasos discretos)
  useEffect(() => {
    if (n <= 1 || containerWidth === 0) return;
    let raf: number;
    let last = performance.now();

    const render = () => {
      if (indexRef.current >= 2 * n) indexRef.current -= n;
      if (indexRef.current < n) indexRef.current += n;

      const offset = containerWidth / 2 - itemWidth * (indexRef.current + 0.5);
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${offset}px)`;
      }

      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const dist = Math.abs(i - indexRef.current);
        const closeness = Math.max(0, 1 - dist);
        el.style.transform = `scale(${0.92 + 0.28 * closeness})`;
        el.style.opacity = String(0.55 + 0.45 * closeness);
      });

      const realActive = Math.round(indexRef.current) % n;
      setActive((prev) => (prev === realActive ? prev : realActive));
    };

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      indexRef.current += dt / MS_PER_ITEM;
      render();
      raf = requestAnimationFrame(tick);
    };

    render();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [n, containerWidth, itemWidth]);

  if (n === 0) return null;

  const extended = [...fotos, ...fotos, ...fotos];

  const step = (delta: number) => {
    indexRef.current += delta;
  };

  const goToReal = (real: number) => {
    const current = Math.round(indexRef.current) % n;
    let delta = real - current;
    if (delta > n / 2) delta -= n;
    if (delta < -n / 2) delta += n;
    step(delta);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[21/9] md:aspect-[32/9] bg-manso-black overflow-hidden group"
    >
      <div ref={trackRef} className="flex h-full items-center will-change-transform">
        {extended.map((foto, i) => (
          <div
            key={`${foto.id}-${i}`}
            className="h-full flex-shrink-0 flex items-center justify-center"
            style={{ width: itemWidth }}
          >
            <div
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className="h-[92%] w-[92%] flex items-center justify-center will-change-transform"
            >
              <img src={foto.url} alt="Taller" className="w-full h-full object-cover" />
            </div>
          </div>
        ))}
      </div>

      {n > 1 && (
        <>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {fotos.map((foto, i) => (
              <button
                key={foto.id}
                onClick={() => goToReal(i)}
                className={`h-1.5 rounded-full transition-all ${i === active ? 'w-6 bg-manso-cream' : 'w-1.5 bg-manso-cream/40'}`}
                aria-label={`Ir a la imagen ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
