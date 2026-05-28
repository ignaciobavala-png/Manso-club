'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { TYPE, OPACITY } from '@/lib/ui-constants';

const transitionConfig = {
  duration: 0.9,
  ease: [0.16, 1, 0.3, 1] as const
};

const getTitle = (slide: any) => ({
  line1: slide.title_line1 || slide.title?.[0] || '',
  line2: slide.title_line2 || slide.title?.[1] || ''
});

export const HeroCarousel = ({ slides }: { slides: any[] }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearTimeout(timer);
  }, [current, slides.length]);

  const currentSlide = slides[current];
  const title = getTitle(currentSlide);

  return (
    <section id="hero" className="relative h-screen flex flex-col justify-end md:justify-center px-8 md:px-[86px] pt-24 pb-10 md:pt-28 md:pb-16 overflow-hidden" style={{ backgroundColor: '#1D1D1B' }}>
      {/* Fondo dinámico: imagen o gradiente */}
      {currentSlide.media_url && currentSlide.tipo === 'imagen' ? (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-900"
          style={{ backgroundImage: `url(${currentSlide.media_url})` }}
        />
      ) : (
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `linear-gradient(to right, hsl(10, 60%, 30%), hsl(330, 20%, 20%), hsl(260, 40%, 15%))`,
          }}
        />
      )}

      {currentSlide.media_url && currentSlide.tipo === 'imagen' && (
        <div className="absolute inset-0 z-[1] bg-black/40" />
      )}

      <div className="absolute top-1/2 right-1/4 transform translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-manso-terra opacity-10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={transitionConfig}
          >
            <header className="mb-6 md:mb-8">
              <span className={`${TYPE.label} ${OPACITY.onDark} block mb-3 md:mb-4`}>
                {currentSlide.tag}
              </span>
              <h1 className={`${TYPE.display} text-manso-cream break-words`}>
                {title.line1} <br />
                <span className={`${TYPE.display} italic font-light text-manso-cream/75`}>{title.line2}</span>
              </h1>
            </header>

            <div className="mt-4 flex flex-col gap-6 max-w-[450px]">
              <p className={`${TYPE.body} md:text-xl ${OPACITY.onDark} text-pretty`}>
                {currentSlide.description?.replace(/\s(\S+)$/, ' $1')}
              </p>

              <div className="flex flex-row gap-3">
                <Link
                  href="/membresias"
                  className="bg-manso-cream text-manso-black px-8 py-4 text-xs font-black uppercase tracking-widest hover:bg-white transition-all active:scale-95"
                >
                  Membresías
                </Link>
                <Link
                  href="/agenda"
                  className="border border-manso-cream/50 text-manso-cream px-8 py-4 text-xs font-black uppercase tracking-widest hover:border-manso-cream transition-all active:scale-95"
                >
                  Ver Agenda
                </Link>
              </div>

              {slides.length > 1 && (
                <div className="flex gap-2 h-4 items-center">
                  {slides.map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        width: i === current ? 32 : 12,
                        backgroundColor: i === current ? "#FFFCDC" : "rgba(255, 252, 220, 0.2)"
                      }}
                      className="h-[1px] rounded-full"
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
