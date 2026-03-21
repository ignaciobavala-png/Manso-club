'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';

interface MembresiaGalleryImage {
  id: string;
  photo_url: string;
  order_index: number;
  active: boolean;
}

interface Props {
  refreshTrigger?: number;
}

export function MembresiaGalleryList({ refreshTrigger }: Props) {
  const [images, setImages] = useState<MembresiaGalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, [refreshTrigger]);

  const fetchImages = async () => {
    const { data } = await supabase
      .from('membresias_gallery')
      .select('*')
      .order('order_index', { ascending: true });
    setImages(data || []);
    setLoading(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase
      .from('membresias_gallery')
      .update({ active: !active })
      .eq('id', id);
    if (!error) setImages(prev => prev.map(img => img.id === id ? { ...img, active: !active } : img));
  };

  const handleDelete = async (image: MembresiaGalleryImage) => {
    if (!confirm('¿Eliminar esta foto?')) return;

    // Intentar borrar del storage
    if (image.photo_url.includes('supabase.co/storage/v1')) {
      try {
        const url = new URL(image.photo_url);
        const parts = url.pathname.split('/');
        const objIdx = parts.findIndex(p => p === 'object') + 2;
        if (objIdx < parts.length) {
          await supabase.storage
            .from(parts[objIdx - 1])
            .remove([parts.slice(objIdx).join('/')]);
        }
      } catch { /* ignorar errores de storage */ }
    }

    const { error } = await supabase.from('membresias_gallery').delete().eq('id', image.id);
    if (!error) setImages(prev => prev.filter(img => img.id !== image.id));
  };

  if (loading) return <div className="text-manso-cream/60 text-center py-8">Cargando galería...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-base font-black uppercase tracking-tighter text-manso-cream flex items-center gap-2">
        <ImageIcon size={18} />
        Fotos Cowork ({images.length})
      </h3>

      {images.length === 0 ? (
        <div className="text-center text-manso-cream/40 py-8 text-sm">
          No hay fotos en la galería todavía
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              className={`relative group rounded-xl border overflow-hidden transition-all ${
                image.active
                  ? 'border-manso-cream/20'
                  : 'border-manso-cream/10 opacity-50'
              }`}
            >
              <div className="aspect-square">
                <img
                  src={image.photo_url}
                  alt={`Cowork ${image.order_index}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Overlay con acciones */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(image.id, image.active)}
                    className={`p-2 rounded-lg transition-all ${
                      image.active
                        ? 'bg-green-500/20 ring-2 ring-green-500/30'
                        : 'bg-red-500/20 ring-2 ring-red-500/30'
                    }`}
                  >
                    {image.active
                      ? <Eye size={13} className="text-green-400" />
                      : <EyeOff size={13} className="text-red-400" />
                    }
                  </button>
                  <button
                    onClick={() => handleDelete(image)}
                    className="p-2 rounded-lg bg-red-500/20 ring-2 ring-red-500/30 transition-all"
                  >
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </div>
              </div>

              {/* Indicador de estado */}
              <div className="absolute top-2 right-2">
                <div className={`w-2.5 h-2.5 rounded-full ${image.active ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
