export const Gallery = () => {
  // URLs de Supabase Storage - reemplaza "tu-bucket" con el nombre de tu bucket
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const bucketName = "gallery-images"; // cambia esto por tu bucket name
  
  const galleryImages = [
    { id: 1, title: "Espacio Principal", fileName: "espacio-principal.jpg", height: "h-64" },
    { id: 2, title: "Área de Trabajo", fileName: "area-trabajo.jpg", height: "h-80" },
    { id: 3, title: "Zona Social", fileName: "zona-social.jpg", height: "h-56" },
    { id: 4, title: "Terraza", fileName: "terraza.jpg", height: "h-72" },
    { id: 5, title: "Bar Interior", fileName: "bar-interior.jpg", height: "h-96" },
    { id: 6, title: "Sala de Eventos", fileName: "sala-eventos.jpg", height: "h-64" },
    { id: 7, title: "Cafetería", fileName: "cafeteria.jpg", height: "h-80" },
    { id: 8, title: "Jardín", fileName: "jardin.jpg", height: "h-56" },
  ];

  // Función para generar URLs públicas de Supabase
  const getSupabaseImageUrl = (fileName: string) => {
    return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${fileName}`;
  };

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
        
        <div className="columns-2 md:columns-4 gap-4 space-y-4">
          {galleryImages.map((image) => (
            <div 
              key={image.id}
              className="group relative overflow-hidden rounded-lg cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl break-inside-avoid mb-4"
            >
              <div 
                className={`w-full ${image.height} bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center`}
                style={{
                  backgroundImage: `url(${getSupabaseImageUrl(image.fileName)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-end justify-start p-4">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">
                    {image.title}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};