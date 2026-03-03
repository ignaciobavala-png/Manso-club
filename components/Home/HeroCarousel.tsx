'use client';

import { useState, useEffect } from 'react';
import { ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

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
    <section id="hero" className="relative min-h-screen flex flex-col justify-center px-8 md:px-20 py-20 overflow-hidden" style={{ backgroundColor: '#1D1D1B' }}>
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
            background: `linear-gradient(to right, hsl(10, 60%, 30%), hsl(330, 20%, 20%), hsl(260, 40%, 15%))`, // Gradiente de la imagen original
          }}
        />
      )}
      
      {/* Overlay oscuro cuando hay imagen */}
      {currentSlide.media_url && currentSlide.tipo === 'imagen' && (
        <div className="absolute inset-0 z-[1] bg-black/40" />
      )}
      
      {/* Aura de refuerzo del cobre en centro-derecha */}
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
            <header className="mb-8">
              <span className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-manso-cream/60 font-bold block mb-4">
                {currentSlide.tag}
              </span>
              <h1 className="text-[16vw] md:text-[11vw] leading-[0.8] font-bold uppercase tracking-tighter text-manso-cream">
                {title.line1} <br />
                <span className="italic font-light opacity-80">{title.line2}</span>
              </h1>
            </header>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mt-4">
              <p className="max-w-[450px] text-manso-cream/80 text-base md:text-xl leading-relaxed font-light min-h-[100px]">
                {currentSlide.description}
              </p>
              
              <div className="flex flex-col items-start gap-6">
                <Link 
                  href="/membresias"
                  className="bg-manso-cream text-manso-black px-6 py-3 text-[9px] font-black uppercase tracking-widest rounded-full hover:bg-manso-white transition-all transform hover:-translate-y-1 active:scale-95"
                >
                  Membresías 2026
                </Link>
                
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

                <div className="flex items-center gap-4 text-manso-cream/40 animate-bounce mt-4 md:mt-0">
                  <span className="text-[9px] uppercase tracking-widest font-bold">Scroll para explorar</span>
                  <ArrowDown size={14} />
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
