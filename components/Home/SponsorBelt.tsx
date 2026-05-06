'use client';

import Image from 'next/image';

const LOGOS = [
  { src: '/marcas/gin.png', alt: 'Gin' },
  { src: '/marcas/birra.png', alt: 'Birra' },
];

export const SponsorBelt = () => {
  const beltLogos = [...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS];

  return (
    <section className="bg-manso-black py-6 sm:py-8 border-t border-manso-cream/10 overflow-hidden">
      <div className="flex gap-8 sm:gap-12 md:gap-16 items-center animate-marquee w-max">
        {beltLogos.map((logo, i) => (
          <Image
            key={i}
            src={logo.src}
            alt={logo.alt}
            width={140}
            height={56}
            className="h-10 sm:h-12 md:h-14 w-auto object-contain opacity-50 grayscale hover:opacity-90 hover:grayscale-0 transition-all duration-500"
          />
        ))}
      </div>
    </section>
  );
};
