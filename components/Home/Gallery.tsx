import { getGalleryImages } from '@/lib/gallery';

const galleryImages = [
  { id: 1, src: "/assets/manso1.webp" },
  { id: 2, src: "/assets/manso2.webp" },
  { id: 3, src: "/assets/manso3.webp" },
  { id: 4, src: "/assets/manso5.webp" },
  { id: 5, src: "/assets/manso7.webp" },
  { id: 6, src: "/assets/manso8.webp" },
];

// Mobile (2-col): only col-span-1, vary row-span — tiles perfectly, no gaps
const mobilePattern = [
  { cols: 1, rows: 2 }, // tall
  { cols: 1, rows: 1 }, // short
  { cols: 1, rows: 1 }, // short
  { cols: 1, rows: 1 }, // short
  { cols: 1, rows: 2 }, // tall
  { cols: 1, rows: 1 }, // short (dense fills the gap)
];

// Desktop (md+): classic masonry with wide/tall combos
const desktopPattern = [
  { cols: 2, rows: 2 }, // big
  { cols: 1, rows: 1 }, // small
  { cols: 1, rows: 1 }, // small
  { cols: 1, rows: 2 }, // tall
  { cols: 1, rows: 1 }, // small
  { cols: 2, rows: 1 }, // wide
];

// Static Tailwind class maps — must be full strings for Tailwind to include them
const mobileColMap: Record<number, string> = { 1: 'col-span-1', 2: 'col-span-2' };
const desktopColMap: Record<number, string> = { 1: 'md:col-span-1', 2: 'md:col-span-2' };
const mobileRowMap: Record<number, string> = { 1: 'row-span-1', 2: 'row-span-2' };
const desktopRowMap: Record<number, string> = { 1: 'md:row-span-1', 2: 'md:row-span-2' };

const getSpanClasses = (index: number) => {
  const mob = mobilePattern[index % mobilePattern.length];
  const desk = desktopPattern[index % desktopPattern.length];
  return `${mobileColMap[mob.cols]} ${desktopColMap[desk.cols]} ${mobileRowMap[mob.rows]} ${desktopRowMap[desk.rows]}`;
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
          <h3 className="text-xl sm:text-2xl md:text-5xl font-medium leading-tight uppercase tracking-tighter italic text-manso-black">
            Nuestro Espacio
          </h3>
        </div>

        {/* Masonry Grid — all screen sizes */}
        <div className="grid grid-cols-2 auto-rows-[150px] grid-flow-dense gap-0
                      md:grid-cols-4 md:auto-rows-[200px]
                      lg:grid-cols-6 lg:auto-rows-[250px]">
          {imagesToDisplay.map((image, index) => {
            const spanClasses = getSpanClasses(index);

            return (
              <div
                key={image.id}
                tabIndex={0}
                className={`group relative overflow-hidden hover:overflow-visible focus:overflow-visible cursor-pointer outline-none transition-all duration-700 ease-out hover:shadow-2xl hover:z-20 hover:scale-125 focus:shadow-2xl focus:z-20 focus:scale-125 ${spanClasses}`}
              >
                <img
                  src={image.src}
                  alt={`Manso Club ${image.id}`}
                  className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:brightness-110 group-focus:brightness-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-700" />
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/30 group-focus:border-white/30 transition-all duration-700" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
