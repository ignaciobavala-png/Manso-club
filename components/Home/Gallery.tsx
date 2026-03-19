import { getGalleryImages } from '@/lib/gallery';

const galleryImages = [
  { id: 1, src: "/assets/manso1.webp" },
  { id: 2, src: "/assets/manso2.webp" },
  { id: 3, src: "/assets/manso3.webp" },
  { id: 4, src: "/assets/manso5.webp" },
  { id: 5, src: "/assets/manso7.webp" },
  { id: 6, src: "/assets/manso8.webp" },
];

// Masonry grid pattern for different screen sizes
const getGridSize = (index: number) => {
  const pattern = [
    { cols: 2, rows: 2 }, // 0: Extra grande (2x2)
    { cols: 1, rows: 1 }, // 1: Normal (1x1)
    { cols: 1, rows: 1 }, // 2: Normal (1x1)
    { cols: 1, rows: 2 }, // 3: Alto (1x2)
    { cols: 1, rows: 1 }, // 4: Normal (1x1)
    { cols: 2, rows: 1 }, // 5: Ancho (2x1)
  ];
  return pattern[index % pattern.length];
};

// Static Tailwind classes mapping for dynamic spans
const getSpanClasses = (cols: number, rows: number) => {
  const spanMap: Record<string, Record<number, string>> = {
    cols: {
      1: 'col-span-1 md:col-span-1 lg:col-span-1',
      2: 'col-span-2 md:col-span-2 lg:col-span-2',
    },
    rows: {
      1: 'row-span-1 md:row-span-1 lg:row-span-1',
      2: 'row-span-2 md:row-span-2 lg:row-span-2',
    },
  };
  return `${spanMap.cols[cols]} ${spanMap.rows[rows]}`;
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

        {/* Masonry Grid */}
        <div className="grid grid-cols-2 gap-0
                      md:grid-cols-4 md:auto-rows-[200px] md:auto-flow-dense md:gap-0
                      lg:grid-cols-6 lg:auto-rows-[250px] lg:gap-0">
          {imagesToDisplay.map((image, index) => {
            // Get grid size pattern for masonry layout
            const gridSize = getGridSize(index);
            const spanClasses = getSpanClasses(gridSize.cols, gridSize.rows);

            return (
              <div
                key={image.id}
                className={`group relative overflow-hidden cursor-pointer transition-all duration-700 ease-out hover:shadow-2xl hover:z-20 hover:scale-125 ${spanClasses}`}
              >
                <img
                  src={image.src}
                  alt={`Manso Club ${image.id}`}
                  className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:brightness-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/30 transition-all duration-700" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
