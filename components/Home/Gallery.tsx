'use client';

import Image from 'next/image';

const galleryImages = [
  { id: 1, src: "/assets/manso1.webp" },
  { id: 2, src: "/assets/manso2.webp" },
  { id: 3, src: "/assets/manso3.webp" },
  { id: 4, src: "/assets/manso5.webp" },
  { id: 5, src: "/assets/manso7.webp" },
  { id: 6, src: "/assets/manso8.webp" },
];

const leftColumn = [galleryImages[0], galleryImages[2], galleryImages[4]];
const rightColumn = [galleryImages[1], galleryImages[3], galleryImages[5]];

export const Gallery = () => {
  return (
    <section 
      className="py-12 md:py-24 px-8 md:px-20"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[10px] uppercase tracking-widest text-manso-black font-bold mb-4 block">02. Galería</span>
          <h3 className="text-2xl md:text-5xl font-medium leading-tight uppercase tracking-tighter italic text-manso-black">
            Nuestro Espacio
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {galleryImages.map((image) => (
            <div 
              key={image.id}
              className="group relative overflow-hidden rounded-lg cursor-pointer transition-all duration-300 hover:shadow-xl"
            >
              <Image
                src={image.src}
                alt={`Manso Club ${image.id}`}
                width={400}
                height={500}
                className="w-full h-48 md:h-64 object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};