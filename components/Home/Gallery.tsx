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
  
  // Use DB images if available, otherwise fallback to hardcoded images
  const imagesToDisplay = hasDbImages 
    ? dbImages.map(img => ({ id: img.id, src: img.photo_url }))
    : galleryImages;

  return (
    <section 
      className="py-12 md:py-24 px-8 md:px-20"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h3 className="text-2xl md:text-5xl font-medium leading-tight uppercase tracking-tighter italic text-manso-black">
            Nuestro Espacio
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {imagesToDisplay.map((image) => (
            <div 
              key={image.id}
              className="group relative overflow-hidden rounded-lg cursor-pointer transition-all duration-300 hover:shadow-xl"
            >
              <img
                src={image.src}
                alt={`Manso Club ${image.id}`}
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