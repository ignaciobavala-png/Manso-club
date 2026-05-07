'use client';

import Image from 'next/image';

const LOGOS = [
  { src: '/marcas/gin.png', alt: 'Gin', small: true, translateY: 'translate-y-2' },
  { src: '/marcas/settle_transparent_clean.png', alt: 'Settle', small: false },
  { src: '/marcas/takenos_transparent_clean(1).png', alt: 'Takenos', small: false },
  { src: '/marcas/warsteiner_transparent.png', alt: 'Warsteiner', small: false, scale: 'scale-125' },
];

export const SponsorBelt = () => {
  return (
    <section className="py-2 sm:py-3" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-4 gap-4 sm:gap-6">
          {LOGOS.map((logo, i) => (
            <div key={i} className={`flex items-center justify-center overflow-visible ${logo.small ? 'h-16 sm:h-20' : 'h-20 sm:h-24 md:h-28'}`}>
              <Image
                src={logo.src}
                alt={logo.alt}
                width={800}
                height={400}
                className={`w-auto object-contain brightness-0 invert opacity-100 transition-opacity duration-500 h-[200%] ${logo.translateY || ''} ${logo.scale || ''}`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
