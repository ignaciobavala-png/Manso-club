'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Image {
  id: string | number;
  src: string;
}

export function GalleryGrid({ images }: { images: Image[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const close = () => setSelectedIndex(null);
  const prev = useCallback(() => setSelectedIndex(i => i !== null ? (i - 1 + images.length) % images.length : null), [images.length]);
  const next = useCallback(() => setSelectedIndex(i => i !== null ? (i + 1) % images.length : null), [images.length]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIndex, prev, next]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-0">
        {images.map((image, i) => (
          <div
            key={image.id}
            onClick={() => setSelectedIndex(i)}
            className="group relative aspect-[4/3] overflow-hidden cursor-pointer outline-none transition-transform duration-300 ease-out active:scale-125 active:z-20 hover:scale-105 hover:z-10"
          >
            <img
              src={image.src}
              alt="Manso Club"
              className="w-full h-full object-cover transition-all duration-300 ease-out group-hover:brightness-110 group-active:brightness-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all duration-300" />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">

          {/* X cerrar */}
          <button
            onClick={close}
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <X size={20} />
          </button>

          {/* Contador */}
          <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/40 text-[10px] font-mono tracking-widest">
            {selectedIndex + 1} / {images.length}
          </span>

          {/* Flecha izquierda */}
          <button
            onClick={prev}
            className="absolute left-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Imagen */}
          <img
            src={images[selectedIndex].src}
            alt="Manso Club"
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />

          {/* Flecha derecha */}
          <button
            onClick={next}
            className="absolute right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <ChevronRight size={22} />
          </button>

          {/* Fondo clickeable para cerrar */}
          <div className="absolute inset-0 -z-10" onClick={close} />
        </div>
      )}
    </>
  );
}
