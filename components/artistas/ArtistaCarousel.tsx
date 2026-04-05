'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ArtistaFoto {
  id: string;
  url: string;
  orden: number;
}

interface Props {
  fotos: ArtistaFoto[];
  artistaNombre: string;
}

export function ArtistaCarousel({ fotos, artistaNombre }: Props) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const prev = () => {
    setDirection(-1);
    setCurrent(c => (c - 1 + fotos.length) % fotos.length);
  };

  const next = () => {
    setDirection(1);
    setCurrent(c => (c + 1) % fotos.length);
  };

  const goTo = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <section className="max-w-[1400px] mx-auto px-6 md:px-12 pb-20">
      <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-manso-cream/40 mb-6">
        Galería
      </h2>

      <div className="relative overflow-hidden rounded-3xl bg-zinc-900 mx-auto max-w-xl aspect-[3/4] md:aspect-[4/3]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.img
            key={current}
            src={fotos[current].url}
            alt={`${artistaNombre} — ${current + 1}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 w-full h-full object-contain p-2"
          />
        </AnimatePresence>

        {/* Flechas de navegación */}
        {fotos.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-10"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-10"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Dots */}
        {fotos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {fotos.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}

        {/* Counter */}
        <span className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white/70 text-[10px] font-mono px-2 py-1 rounded-full z-10">
          {current + 1} / {fotos.length}
        </span>
      </div>
    </section>
  );
}
