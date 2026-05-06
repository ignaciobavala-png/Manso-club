'use client';

import { motion, type Easing } from 'framer-motion';

const ease: Easing = [0.16, 1, 0.3, 1];

const fadeUp = (delay: number = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' as const },
  transition: { duration: 0.6, ease, delay }
});

export const AboutUsPreviewClient = ({
  subtitle,
  paragraphs
}: {
  subtitle: string;
  paragraphs: string[];
}) => {
  return (
    <section
      className="relative py-8 sm:py-10 md:py-12 px-4 sm:px-8 md:px-20"
      style={{
        backgroundColor: '#FFFFFF',
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
        backgroundSize: '48px 48px'
      }}
    >
      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Línea umbral — texto asciende desde abajo hasta posicionarse sobre la línea */}
        <div className="relative mb-6 sm:mb-8 h-20 sm:h-24 md:h-28">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-black/10" />
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 right-0 top-1/2 flex justify-center"
          >
            <h2
              className="px-3 sm:px-8 text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter italic bg-white text-manso-black leading-none"
              style={{ transform: 'translateY(-50%)' }}
            >
              SOBRE MANSO
            </h2>
          </motion.div>
        </div>

        <div className="space-y-6">
          {paragraphs.map((p, i) => (
            <motion.p
              key={i}
              {...fadeUp(0.15 + i * 0.1)}
              className="text-base sm:text-lg md:text-xl text-manso-black/85 leading-relaxed font-light"
            >
              {p}
            </motion.p>
          ))}
        </div>
      </div>
    </section>
  );
};
