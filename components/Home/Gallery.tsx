import { getGalleryImages } from '@/lib/gallery';
import { GalleryGrid } from './GalleryGrid';

const galleryImages = [
  { id: 1, src: "/assets/manso1.webp" },
  { id: 2, src: "/assets/manso2.webp" },
  { id: 3, src: "/assets/manso3.webp" },
  { id: 4, src: "/assets/manso5.webp" },
  { id: 5, src: "/assets/manso7.webp" },
  { id: 6, src: "/assets/manso8.webp" },
];

export const Gallery = async () => {
  const dbImages = await getGalleryImages();
  const hasDbImages = dbImages.length > 0;

  const all = hasDbImages
    ? dbImages.map(img => ({ id: img.id, src: img.photo_url }))
    : galleryImages;

  // Recortar a múltiplo de 3 → cada fila siempre completa, cero celdas vacías
  const cols = 3;
  const count = Math.floor(all.length / cols) * cols || cols;
  const images = all.slice(0, count);

  return (
    <section
      className="py-8 sm:py-12 md:py-24 px-4 sm:px-8 md:px-20"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-medium leading-tight uppercase tracking-tighter italic text-manso-black">
            Nuestro Espacio
          </h3>
        </div>

        <GalleryGrid images={images} />
      </div>
    </section>
  );
};
