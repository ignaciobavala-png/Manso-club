import { getGalleryImages } from '@/lib/gallery';

const galleryImages = [
  { id: 1, src: "/assets/manso1.webp" },
  { id: 2, src: "/assets/manso2.webp" },
  { id: 3, src: "/assets/manso3.webp" },
  { id: 4, src: "/assets/manso5.webp" },
  { id: 5, src: "/assets/manso7.webp" },
  { id: 6, src: "/assets/manso8.webp" },
];

// Mobile (2-col): vary row-span para ritmo visual, grid-flow-dense rellena huecos
const mobilePattern = [
  { cols: 1, rows: 2 },
  { cols: 1, rows: 1 },
  { cols: 1, rows: 1 },
  { cols: 1, rows: 1 },
  { cols: 1, rows: 2 },
  { cols: 1, rows: 1 },
];

const mobileColMap: Record<number, string> = { 1: 'col-span-1', 2: 'col-span-2' };
const mobileRowMap: Record<number, string> = { 1: 'row-span-1', 2: 'row-span-2' };

const getMobileClasses = (index: number) => {
  const mob = mobilePattern[index % mobilePattern.length];
  return `${mobileColMap[mob.cols]} ${mobileRowMap[mob.rows]}`;
};

export const Gallery = async () => {
  const dbImages = await getGalleryImages();
  const hasDbImages = dbImages.length > 0;

  // Use DB images if available, otherwise fallback to hardcoded images
  const imagesToDisplay = hasDbImages
    ? dbImages.map(img => ({ id: img.id, src: img.photo_url }))
    : galleryImages;

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

        {/* DESKTOP: CSS columns — masonry nativo, cero gaps garantizados */}
        <div className="hidden md:columns-3 lg:columns-4 md:block gap-0">
          {imagesToDisplay.map((image) => (
            <div
              key={image.id}
              tabIndex={0}
              className="group relative break-inside-avoid overflow-hidden hover:overflow-visible focus:overflow-visible cursor-pointer outline-none transition-all duration-700 ease-out hover:scale-125 hover:z-20 hover:shadow-2xl focus:scale-125 focus:z-20 focus:shadow-2xl"
            >
              <img
                src={image.src}
                alt={`Manso Club ${image.id}`}
                className="w-full block object-cover transition-all duration-700 ease-out group-hover:brightness-110 group-focus:brightness-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-700" />
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/20 group-focus:border-white/20 transition-all duration-700" />
            </div>
          ))}
        </div>

        {/* MOBILE: CSS grid 2 columnas con row-span variable */}
        <div className="grid md:hidden grid-cols-2 auto-rows-[150px] grid-flow-dense gap-0">
          {imagesToDisplay.map((image, index) => (
            <div
              key={image.id}
              tabIndex={0}
              className={`group relative overflow-hidden cursor-pointer outline-none ${getMobileClasses(index)}`}
            >
              <img
                src={image.src}
                alt={`Manso Club ${image.id}`}
                className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:brightness-110 group-focus:brightness-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-700" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
