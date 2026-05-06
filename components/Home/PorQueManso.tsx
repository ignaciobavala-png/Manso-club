'use client';

import { motion, useScroll, useTransform, type Easing } from 'framer-motion';
import { useRef, Children } from 'react';
import { ParticleBackground } from './ParticleBackground';
import { TYPE, OPACITY } from '@/lib/ui-constants';

const ease: Easing = [0.16, 1, 0.3, 1];

const AnimatedLine = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center']
  });
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const clipRight = useTransform(progress, (v) => `inset(0 ${100 - v * 100}% 0 0)`);

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      <div style={{ opacity: 0.15 }} aria-hidden="true">
        {children}
      </div>
      <motion.div style={{ clipPath: clipRight, position: 'absolute', inset: 0 }}>
        {children}
      </motion.div>
    </div>
  );
};

const fadeUp = (delay: number = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' as const },
  transition: { duration: 0.6, ease, delay }
});

const bloques = [
  {
    titulo: 'COMUNIDAD & TALENTO LOCAL',
    texto: 'Artistas, creativos, entusiastas y emprendedores apostando por un futuro en comunidad. ¿Cuándo fue la última vez que te sentiste parte?'
  },
  {
    titulo: '"TU TERCER LUGAR"',
    texto: 'Un espacio colaborativo para quienes buscan nuevas formas de habitar la ciudad y conocer a otros con intereses similares. "No encontrábamos nuestro club, entonces hicimos uno"'
  },
  {
    titulo: 'ESPACIO HÍBRIDO Y CURADURÍA',
    texto: 'Multiespacio de 6 ambientes con salas de cowork, terraza y espacio para eventos en Colegiales. Música, workshops, exposiciones, talleres, charlas, debates y más.'
  },
  {
    titulo: 'OPORTUNIDADES Y COLABORACIONES',
    texto: 'En Manso conviven distintas disciplinas y proyectos, como también personas que están buscando su camino. La fusión de todos esos mundos, da lugar a nuevas oportunidades.'
  }
];

const textoLinea = 'text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85]';
const textWhite = `${textoLinea} text-white`;
const textOlive = `${textoLinea} italic text-manso-olive`;
const textManifiesto = 'text-2xl sm:text-3xl md:text-4xl italic font-light text-white/90 leading-snug';

export const PorQueManso = ({ children }: { children?: React.ReactNode }) => {
  const imgs = Children.toArray(children);

  return (
    <section className="relative py-6 sm:py-8 md:py-14 px-4 sm:px-8 md:px-20 bg-manso-black overflow-hidden border-b border-manso-cream/10">
      <ParticleBackground />
      <div className="relative z-10 w-full">
        {/* TÍTULO + MANIFIESTO — centrado, ancho completo */}
        <div className="mb-12 md:mb-16 space-y-4 sm:space-y-3 text-center px-2 sm:px-4 md:px-8">
          <AnimatedLine>
            <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap justify-center gap-y-1">
              <span className={textWhite}>NUESTRO ADN</span>
              {imgs[0]}
            </div>
          </AnimatedLine>

          <AnimatedLine>
            <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap justify-center gap-y-1">
              <span className={textWhite}>MUCHO MÁS</span>
              {imgs[1]}
              <span className={textOlive}>QUE UN CLUB.</span>
            </div>
          </AnimatedLine>

          <AnimatedLine>
            <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap justify-center gap-y-1">
              <span className={textWhite}>EL TALENTO</span>
              {imgs[2]}
              <span className={textWhite}>SIEMPRE ESTUVO,</span>
            </div>
          </AnimatedLine>

          <AnimatedLine>
            <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap justify-center gap-y-1">
              <span className={textWhite}>FALTABA</span>
              {imgs[3]}
              <span className={textWhite}>UN LUGAR.</span>
            </div>
          </AnimatedLine>
        </div>

        {/* LÍNEA DECORATIVA */}
        <motion.div {...fadeUp(0.5)} className="w-full h-px bg-manso-cream/10 mb-12 md:mb-16" />

        {/* BLOQUES DE CONTENIDO — cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-12 md:mb-16 px-4 sm:px-8 md:px-20">
          {bloques.map((bloque, i) => (
            <motion.div
              key={i}
              {...fadeUp(0.8 + i * 0.1)}
              className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 sm:p-6 md:p-7 hover:bg-white/10 hover:border-white/25 transition-all duration-500 group"
            >
              <h3 className={`${TYPE.h4} text-manso-olive mb-3`}>
                {bloque.titulo}
              </h3>
              <p className={`${TYPE.bodySmall} ${OPACITY.onDark} leading-relaxed group-hover:text-white transition-colors duration-500`}>
                {bloque.texto}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
