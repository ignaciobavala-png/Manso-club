'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { TYPE } from '@/lib/ui-constants';

const transitionConfig = {
  duration: 0.9,
  ease: [0.16, 1, 0.3, 1] as const
};

export interface CarouselSlide {
  tipo?: 'texto' | 'imagen' | 'video';
  media_url?: string | null;
  title_line1?: string | null;
  title_line2?: string | null;
  /** Forma vieja del fallback hardcodeado: [line1, line2]. */
  title?: string[];
}

const getTitle = (slide: CarouselSlide) => ({
  line1: slide.title_line1 || slide.title?.[0] || '',
  line2: slide.title_line2 || slide.title?.[1] || ''
});

// El `type` del <source> tiene que coincidir con el archivo o Chrome descarta
// la fuente sin intentar reproducirla. Antes estaba hardcodeado a mp4 y los
// .webm subidos desde el panel no arrancaban.
const videoMimeType = (url: string) => {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  if (ext === 'webm') return 'video/webm';
  if (ext === 'ogv' || ext === 'ogg') return 'video/ogg';
  return 'video/mp4';
};

export const HeroCarousel = ({ slides }: { slides: CarouselSlide[] }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearTimeout(timer);
  }, [current, slides.length]);

  const currentSlide = slides[current];
  const title = getTitle(currentSlide);
  const hasMedia = Boolean(currentSlide.media_url);
  const isVideo = hasMedia && currentSlide.tipo === 'video';
  const isImage = hasMedia && currentSlide.tipo === 'imagen';

  return (
    <section id="hero" className="relative h-screen flex flex-col items-center justify-center px-8 md:px-[96px] pt-24 pb-16 md:pt-28 overflow-hidden" style={{ backgroundColor: '#000000' }}>
      {/* Fondo dinámico: video, imagen o gradiente */}
      {isVideo && currentSlide.media_url ? (
        <video
          key={currentSlide.media_url}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src={currentSlide.media_url} type={videoMimeType(currentSlide.media_url)} />
        </video>
      ) : isImage ? (
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

      {hasMedia && <div className="absolute inset-0 z-[1] bg-black/40" />}

      <div className="absolute top-1/2 right-1/4 transform translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-manso-terra opacity-10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={transitionConfig}
            className="flex flex-col items-center"
          >
            <h1 className={`${TYPE.hero} text-manso-cream text-balance`}>
              {title.line1}
              {title.line2 && (
                <>
                  {' '}
                  <br className="hidden sm:block" />
                  {title.line2}
                </>
              )}
            </h1>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 md:mt-10 flex flex-row flex-wrap justify-center gap-3">
          <Link
            href="/membresias"
            className="rounded-full bg-manso-cream text-manso-black px-8 py-4 text-xs font-black uppercase tracking-widest hover:bg-white transition-all active:scale-95"
          >
            Membresías
          </Link>
          <Link
            href="/agenda"
            className="rounded-full border border-manso-cream/50 text-manso-cream px-8 py-4 text-xs font-black uppercase tracking-widest hover:border-manso-cream transition-all active:scale-95"
          >
            Ver Agenda
          </Link>
        </div>

        {slides.length > 1 && (
          <div className="mt-8 flex gap-2 h-4 items-center justify-center">
            {slides.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === current ? 32 : 12,
                  backgroundColor: i === current ? "#FFFCDC" : "rgba(255, 252, 220, 0.2)"
                }}
                className="h-[2px] rounded-full"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
