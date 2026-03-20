import { getGalleryImages } from '@/lib/gallery';

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

        {/* Grid uniforme — celdas fijas, object-cover, cero huecos, borde contenedor */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-0 border border-zinc-200 shadow-sm overflow-hidden">
          {images.map((image) => (
            <div
              key={image.id}
              tabIndex={0}
              className="group relative aspect-[4/3] overflow-hidden cursor-pointer outline-none"
            >
              <img
                src={image.src}
                alt={`Manso Club ${image.id}`}
                className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-110 group-focus:scale-110 group-focus:brightness-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-700" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
