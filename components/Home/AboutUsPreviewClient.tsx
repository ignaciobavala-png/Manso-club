'use client';

import { motion, type Easing } from 'framer-motion';

const ease: Easing = [0.16, 1, 0.3, 1];

const noOrphan = (text: string) => text.replace(/\s(\S+)$/, ' $1');

const fadeUp = (delay: number = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' as const },
  transition: { duration: 0.6, ease, delay }
});

export const AboutUsPreviewClient = ({
  subtitle,
  paragraphs,
  mainPhotoUrl,
}: {
  subtitle: string;
  paragraphs: string[];
  mainPhotoUrl: string | null;
}) => {
  return (
    <section
      className="relative py-8 sm:py-10 md:py-16 px-4 sm:px-8 md:px-[86px] bg-manso-black"
      style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '48px 48px'
      }}
    >
      <div className="relative z-10 mx-auto">
        {/* Título con línea umbral */}
        <div className="relative mb-8 sm:mb-10 h-20 sm:h-24 md:h-28">
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 right-0 top-1/2 flex justify-center"
          >
            <h2
              className="px-3 sm:px-8 text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter italic bg-manso-black text-white leading-none"
              style={{ transform: 'translateY(-50%)' }}
            >
              SOBRE MANSO
            </h2>
          </motion.div>
        </div>

        {/* Layout: texto izquierda + imagen derecha */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
          {/* Texto + botones */}
          <div className="w-full md:w-1/2 space-y-5">
            {paragraphs.map((p, i) => (
              <motion.p
                key={i}
                {...fadeUp(0.15 + i * 0.1)}
                className="text-base sm:text-lg md:text-xl text-white/85 leading-relaxed font-light text-pretty"
              >
                {noOrphan(p)}
              </motion.p>
            ))}
          </div>

          {/* Imagen */}
          <motion.div
            {...fadeUp(0.2)}
            className="w-full md:w-1/2"
          >
            {mainPhotoUrl ? (
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={mainPhotoUrl}
                  alt="Manso Club"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[4/3] bg-white/5 flex items-center justify-center">
                <span className="text-white/20 text-sm uppercase tracking-widest">Sin foto</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
