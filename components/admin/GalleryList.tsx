'use client';

import { useState, useEffect } from 'react';
import { getAllGalleryImages, GalleryImage } from '@/lib/gallery';
import { supabase } from '@/lib/supabase';
import { Trash2, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';

interface GalleryListProps {
  refreshTrigger?: number;
}

export function GalleryList({ refreshTrigger }: GalleryListProps) {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGalleryImages();
  }, [refreshTrigger]);

  const fetchGalleryImages = async () => {
    try {
      const data = await getAllGalleryImages();
      setGalleryImages(data);
    } catch (error) {
      console.error('Error fetching gallery images:', error);
    }
    setLoading(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('gallery_images')
        .update({ active: !active })
        .eq('id', id);
      
      if (error) throw error;
      
      setGalleryImages(prev =>
        prev.map(image => image.id === id ? { ...image, active: !active } : image)
      );
    } catch (error: any) {
      alert('Error al actualizar estado: ' + error.message);
    }
  };

  const handleDelete = async (image: GalleryImage) => {
    if (!confirm('¿Eliminar esta imagen? Esta acción no se puede deshacer.')) return;

    try {
      // Borrar archivo de storage si existe
      if (image.photo_url && image.photo_url.includes('supabase.co/storage/v1')) {
        try {
          // Extraer path del archivo de la URL
          const url = new URL(image.photo_url);
          const pathParts = url.pathname.split('/');
          const objectIndex = pathParts.findIndex(part => part === 'object') + 2;
          if (objectIndex < pathParts.length) {
            const filePath = pathParts.slice(objectIndex).join('/');
            const bucket = pathParts[objectIndex - 1];
            
            const { error: storageError } = await supabase.storage
              .from(bucket)
              .remove([filePath]);
            
            if (storageError) {
              console.warn('Error al eliminar archivo de storage:', storageError);
            }
          }
        } catch (storageError) {
          console.warn('Error procesando URL de storage:', storageError);
        }
      }

      // Borrar registro de la base de datos
      const { error } = await supabase
        .from('gallery_images')
        .delete()
        .eq('id', image.id);
      
      if (error) throw error;
      
      setGalleryImages(prev => prev.filter(img => img.id !== image.id));
    } catch (error: any) {
      alert('Error al eliminar: ' + error.message);
    }
  };

  if (loading) {
    return <div className="text-manso-cream/60 text-center py-8">Cargando imágenes de la galería...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-black uppercase tracking-tighter text-manso-cream mb-6 flex items-center gap-2">
        <ImageIcon size={20} />
        Galería de Imágenes ({galleryImages.length})
      </h3>

      {galleryImages.length === 0 ? (
        <div className="text-center text-manso-cream/40 py-8">
          No hay imágenes en la galería
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {galleryImages.map((image) => (
            <div
              key={image.id}
              className={`relative group rounded-2xl border transition-all overflow-hidden ${
                image.active
                  ? 'bg-manso-cream/10 border-manso-cream/20'
                  : 'bg-manso-black/20 border-manso-cream/10 opacity-60'
              }`}
            >
              {/* Imagen thumbnail */}
              <div className="aspect-square w-full">
                <img
                  src={image.photo_url}
                  alt={`Imagen ${image.order_index}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Overlay con info y acciones */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  {/* Info */}
                  <div className="mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-manso-terra px-2 py-0.5 border border-manso-terra/30 rounded inline-block">
                      Orden: {image.order_index}
                    </span>
                    {!image.active && (
                      <span className="text-[9px] uppercase font-bold text-red-400 px-2 py-0.5 border border-red-400/30 rounded ml-2">
                        Inactivo
                      </span>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(image.id, image.active)}
                      className={`p-2 rounded-lg transition-all ${
                        image.active
                          ? 'bg-green-500/20 hover:bg-green-500/30 ring-2 ring-green-500/30'
                          : 'bg-red-500/20 hover:bg-red-500/30 ring-2 ring-red-500/30'
                      }`}
                      title={image.active ? 'Desactivar imagen' : 'Activar imagen'}
                    >
                      {image.active ? (
                        <Eye size={14} className="text-green-400" />
                      ) : (
                        <EyeOff size={14} className="text-red-400" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(image)}
                      className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 ring-2 ring-red-500/30 transition-all"
                      title="Eliminar imagen"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Indicador de estado visible siempre */}
              <div className="absolute top-2 right-2">
                <div className={`w-3 h-3 rounded-full ${
                  image.active ? 'bg-green-500' : 'bg-red-500'
                }`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
