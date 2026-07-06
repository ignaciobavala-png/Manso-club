'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Foto {
  id: string;
  url: string;
}

export function TallerCarousel({ fotos }: { fotos: Foto[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const scrollToIndex = useCallback((index: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const child = scroller.children[index] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  }, []);

  const goTo = useCallback((index: number) => {
    const next = (index + fotos.length) % fotos.length;
    setActive(next);
    scrollToIndex(next);
  }, [fotos.length, scrollToIndex]);

  // Autoplay
  useEffect(() => {
    if (fotos.length <= 1) return;
    const id = setInterval(() => goTo(active + 1), 4500);
    return () => clearInterval(id);
  }, [active, fotos.length, goTo]);

  if (fotos.length === 0) return null;

  return (
    <div className="relative w-full aspect-[16/9] md:aspect-[21/9] bg-manso-blue/20 overflow-hidden group">
      <div
        ref={scrollerRef}
        className="flex h-full overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth"
      >
        {fotos.map((foto) => (
          <div key={foto.id} className="w-full h-full flex-shrink-0 snap-start">
            <img src={foto.url} alt="Taller" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      {fotos.length > 1 && (
        <>
          <button
            onClick={() => goTo(active - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => goTo(active + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Siguiente"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {fotos.map((foto, i) => (
              <button
                key={foto.id}
                onClick={() => goTo(i)}
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
