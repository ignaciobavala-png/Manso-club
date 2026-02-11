'use client';

import { useState, useEffect } from 'react';
import { ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HERO_SLIDES = [
  {
    tag: "01. Quiénes Somos",
    title: ["Espacio", "Creativo"],
    description: "Manso es un ecosistema nacido en Buenos Aires donde conviven el diseño, la tecnología y la cultura electrónica. Sanamos el trabajo a través de la comunidad.",
  },
  {
    tag: "02. Nuestra Visión",
    title: ["Sonido", "Digital"],
    description: "Impulsamos la cultura electrónica local a través de experiencias inmersivas y curaduría sonora de vanguardia.",
  },
  {
    tag: "03. Comunidad",
    title: ["Manso", "Club"],
    description: "Un espacio de pertenencia para mentes creativas. Conectamos talento local con impacto global.",
  }
];

const transitionConfig = { 
  duration: 0.9, 
  ease: [0.16, 1, 0.3, 1] as const 
};

export const Hero = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // Usamos setTimeout en lugar de setInterval para evitar que se pisen los hilos
    const timer = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000); 

    // Limpieza atómica: al cambiar 'current', el timer viejo muere antes de crear el nuevo
    return () => clearTimeout(timer);
  }, [current]); // Dependencia en 'current' para reiniciar el ciclo limpiamente

  return (
    <section id="quienes-somos" className="relative min-h-screen flex flex-col justify-center px-6 md:px-20 py-20 overflow-hidden bg-black">
      <div className="absolute inset-0 bg-manso-gradient opacity-95 pointer-events-none"></div>
      <div className="absolute top-20 right-10 w-64 h-64 bg-manso-cream opacity-5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={transitionConfig}
          >
            <header className="mb-8">
              <span className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-manso-cream/60 font-bold block mb-4">
                {HERO_SLIDES[current].tag}
              </span>
              <h2 className="text-[16vw] md:text-[11vw] leading-[0.8] font-bold uppercase tracking-tighter text-manso-cream">
                {HERO_SLIDES[current].title[0]} <br /> 
                <span className="italic font-light opacity-80">{HERO_SLIDES[current].title[1]}</span>
              </h2>
            </header>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mt-4">
              <p className="max-w-[450px text-manso-cream/80 text-base md:text-xl leading-relaxed font-light min-h-[100px]">
                {HERO_SLIDES[current].description}
              </p>
              
              <div className="flex flex-col items-start gap-6">
                <button className="bg-manso-cream text-manso-black px-10 py-5 text-[10px] font-black uppercase tracking-widest hover:bg-manso-white transition-all transform hover:-translate-y-1 active:scale-95">
                  Membresías 2026
                </button>
                
                <div className="flex gap-2 h-4 items-center">
                  {HERO_SLIDES.map((_, i) => (
                    <motion.div 
                      key={i} 
                      animate={{ 
                        width: i === current ? 32 : 12,
                        backgroundColor: i === current ? "#F5F5DC" : "rgba(245, 245, 220, 0.2)" 
                      }}
                      transition={transitionConfig}
                      className="h-[1px rounded-full" 
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

      <div className="hidden lg:block absolute right-10 bottom-40 rotate-90 origin-right">
        <span className="text-[10px] uppercase tracking-[1em] text-manso-cream/20 font-bold">
          BUENOS AIRES — ARGENTINA
        </span>
      </div>
    </section>
  );
};