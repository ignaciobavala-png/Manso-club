'use client';

import { useState, useEffect } from 'react';
import { getAllHeroSlides, HeroSlide } from '@/lib/hero';
import { supabase } from '@/lib/supabase';
import { Edit2, Trash2, Eye, EyeOff, Image, Video, Type } from 'lucide-react';

interface HeroListProps {
  refreshTrigger?: number;
}

export function HeroList({ refreshTrigger }: HeroListProps) {
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeroSlides();
  }, [refreshTrigger]);

  const fetchHeroSlides = async () => {
    try {
      const data = await getAllHeroSlides();
      setHeroSlides(data);
    } catch (error) {
      console.error('Error fetching hero slides:', error);
    }
    setLoading(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('hero_config')
        .update({ active: !active })
        .eq('id', id);
      
      if (error) throw error;
      
      setHeroSlides(prev =>
        prev.map(slide => slide.id === id ? { ...slide, active: !active } : slide)
      );
    } catch (error: any) {
      alert('Error al actualizar estado: ' + error.message);
    }
  };

  const handleEdit = (slide: HeroSlide) => {
    window.dispatchEvent(new CustomEvent('editHeroSlide', { detail: slide }));
  };

  const handleDelete = async (slide: HeroSlide) => {
    const title = slide.title_line1 + (slide.title_line2 ? ' ' + slide.title_line2 : '');
    if (!confirm(`¿Eliminar slide "${title}"? Esta acción no se puede deshacer.`)) return;

    try {
      // Borrar archivo de storage si existe
      if (slide.media_url && slide.media_url.includes('supabase.co/storage/v1')) {
        try {
          // Extraer path del archivo de la URL
          const url = new URL(slide.media_url);
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
        .from('hero_config')
        .delete()
        .eq('id', slide.id);
      
      if (error) throw error;
      
      setHeroSlides(prev => prev.filter(s => s.id !== slide.id));
    } catch (error: any) {
      alert('Error al eliminar: ' + error.message);
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'imagen': return <Image size={14} />;
      case 'video': return <Video size={14} />;
      case 'texto': return <Type size={14} />;
      default: return <Type size={14} />;
    }
  };

  const getTipoBadge = (tipo: string) => {
    const colors = {
      'texto': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'imagen': 'bg-green-500/20 text-green-400 border-green-500/30',
      'video': 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };
    return colors[tipo as keyof typeof colors] || colors.texto;
  };

  if (loading) {
    return <div className="text-manso-cream/60 text-center py-8">Cargando slides del hero...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-black uppercase tracking-tighter text-manso-cream mb-6 flex items-center gap-2">
        <Image size={20} />
        Hero Slides ({heroSlides.length})
      </h3>

      {heroSlides.length === 0 ? (
        <div className="text-center text-manso-cream/40 py-8">
          No hay slides del hero configurados
        </div>
      ) : (
        heroSlides.map((slide) => (
          <div
            key={slide.id}
            className={`p-4 rounded-2xl border transition-all ${
              slide.active
                ? 'bg-manso-cream/10 border-manso-cream/20'
                : 'bg-manso-black/20 border-manso-cream/10 opacity-60'
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Preview del media */}
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-manso-cream/5">
                {slide.media_url && slide.tipo !== 'texto' ? (
                  slide.tipo === 'imagen' ? (
                    <img
                      src={slide.media_url}
                      alt={slide.title_line1}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-purple-500/20">
                      <Video size={24} className="text-purple-400" />
                    </div>
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Type size={24} className="text-manso-cream/30" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className={`text-lg font-bold uppercase tracking-tighter text-manso-cream ${
                  !slide.active ? 'line-through decoration-1 decoration-manso-cream/50' : ''
                }`}>
                  {slide.title_line1}
                  {slide.title_line2 && <span className="block text-sm">{slide.title_line2}</span>}
                </h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  {slide.tag && (
                    <span className="text-[9px] uppercase tracking-widest text-manso-cream/60 px-2 py-0.5 border border-manso-cream/20 rounded">
                      {slide.tag}
                    </span>
                  )}
                  <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border rounded flex items-center gap-1 ${getTipoBadge(slide.tipo)}`}>
                    {getTipoIcon(slide.tipo)}
                    {slide.tipo.toUpperCase()}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-manso-terra px-2 py-0.5 border border-manso-terra/30 rounded">
                    Orden: {slide.order_index}
                  </span>
                  {!slide.active && (
                    <span className="text-[9px] uppercase font-bold text-red-400 px-2 py-0.5 border border-red-400/30 rounded">
                      Inactivo
                    </span>
                  )}
                </div>
                {slide.description && (
                  <p className="text-sm text-manso-cream/60 mt-2 line-clamp-2">{slide.description}</p>
                )}
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleEdit(slide)}
                  className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 ring-2 ring-blue-500/30 transition-all"
                  title="Editar slide"
                >
                  <Edit2 size={14} className="text-blue-400" />
                </button>

                <button
                  onClick={() => toggleActive(slide.id, slide.active)}
                  className={`p-2 rounded-lg transition-all ${
                    slide.active
                      ? 'bg-green-500/20 hover:bg-green-500/30 ring-2 ring-green-500/30'
                      : 'bg-red-500/20 hover:bg-red-500/30 ring-2 ring-red-500/30'
                  }`}
                  title={slide.active ? 'Desactivar slide' : 'Activar slide'}
                >
                  {slide.active ? (
                    <Eye size={14} className="text-green-400" />
                  ) : (
                    <EyeOff size={14} className="text-red-400" />
                  )}
                </button>

                <button
                  onClick={() => handleDelete(slide)}
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 ring-2 ring-red-500/30 transition-all"
                  title="Eliminar slide"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
