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
      className="relative py-6 sm:py-8 md:py-16 px-4 sm:px-8 md:px-20"
      style={{ backgroundColor: '#1D1D1B', backgroundImage: 'linear-gradient(rgba(255,255,220,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,220,0.07) 1px, transparent 1px)', backgroundSize: '48px 48px' }}
    >
      <div className="relative z-10 max-w-7xl mx-auto">
        <GalleryGrid images={images} />
      </div>
    </section>
  );
};
