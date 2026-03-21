'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ImageUploader } from './ImageUploader';
import { HeroSlide } from '@/lib/hero';
import { Type, Image, Video, Hash, FileText } from 'lucide-react';

interface HeroSlideEdit {
  id: string;
  tag: string | null;
  title_line1: string;
  title_line2: string | null;
  description: string | null;
  tipo: 'texto' | 'imagen' | 'video';
  media_url: string | null;
  order_index: number;
  active: boolean;
}

export function FormHero() {
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState(0);
  const [formData, setFormData] = useState({
    tag: '',
    title_line1: '',
    title_line2: '',
    description: '',
    tipo: 'texto' as 'texto' | 'imagen' | 'video',
    media_url: '',
    order_index: '1'
  });

  useEffect(() => {
    const handleEditEvent = (event: CustomEvent<HeroSlideEdit>) => {
      const slide = event.detail;
      setEditingId(slide.id);
      setFormData({
        tag: slide.tag || '',
        title_line1: slide.title_line1 || '',
        title_line2: slide.title_line2 || '',
        description: slide.description || '',
        tipo: slide.tipo,
        media_url: slide.media_url || '',
        order_index: slide.order_index.toString()
      });
      setImageKey(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('editHeroSlide', handleEditEvent as EventListener);
    return () => {
      window.removeEventListener('editHeroSlide', handleEditEvent as EventListener);
    };
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormData({ 
      tag: '', 
      title_line1: '', 
      title_line2: '', 
      description: '', 
      tipo: 'texto', 
      media_url: '', 
      order_index: '1' 
    });
    setImageKey(prev => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const slideData = {
        tag: formData.tag || null,
        title_line1: formData.title_line1,
        title_line2: formData.title_line2 || null,
        description: formData.description || null,
        tipo: formData.tipo,
        media_url: (formData.tipo === 'imagen' || formData.tipo === 'video') ? formData.media_url : null,
        order_index: parseInt(String(formData.order_index)) || 1,
        active: true
      };

      if (editingId) {
        const { error } = await supabase
          .from('hero_config')
          .update(slideData)
          .eq('id', editingId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hero_config')
          .insert(slideData);
        
        if (error) throw error;
      }

      alert(editingId ? '¡Slide actualizado correctamente!' : '¡Slide agregado correctamente!');
      resetForm();
      window.dispatchEvent(new CustomEvent('dashboardRefresh'));
      
      // Revalidar cache
      try {
        const response = await fetch('/api/revalidate', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` }
        });
        
        if (!response.ok) {
          const error = await response.text();
          console.error('Error en revalidación:', response.status, error);
        } else {
        }
      } catch (error) {
        console.error('❌ Error revalidando cache:', error);
      }
    } catch (error: any) {
      alert(error.message);
    }

    setLoading(false);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'imagen': return <Image size={20} />;
      case 'video': return <Video size={20} />;
      case 'texto': return <Type size={20} />;
      default: return <Type size={20} />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-manso-cream/5 p-8 rounded-[2.5rem] border border-manso-cream/10 shadow-xl">
      {/* Header dinamico */}
      <div className="mb-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-manso-cream mb-2">
          {editingId ? 'Editar Slide del Hero' : 'Nuevo Slide del Hero'}
        </h2>
        {editingId && (
          <p className="text-sm text-manso-cream/60">
            Modificando: {formData.title_line1}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Tipo de Slide */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-manso-cream/60 ml-2">
            Tipo de Slide
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['texto', 'imagen', 'video'] as const).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setFormData({...formData, tipo, media_url: ''})}
                className={`p-3 rounded-xl border-2 transition-all font-bold uppercase tracking-wider text-xs ${
                  formData.tipo === tipo
                    ? 'bg-manso-terra text-manso-cream border-manso-terra'
                    : 'bg-manso-cream/10 text-manso-cream/60 border-manso-cream/20 hover:border-manso-cream/40'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {getTipoIcon(tipo)}
                  {tipo}
                </div>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-manso-cream/40 ml-2 mt-1">
            Seleccioná primero el tipo de slide antes de subir contenido
          </p>
        </div>

        {/* Zona de Media segun el tipo */}
        {formData.tipo === 'imagen' && (
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-manso-cream/60 ml-2 flex items-center gap-2">
              {getTipoIcon('imagen')}
              Imagen del Slide
            </label>
            <div className={`${!formData.media_url ? 'ring-2 ring-manso-terra/50 rounded-3xl' : ''}`}>
              <ImageUploader
                key={imageKey}
                bucket="hero-media"
                folder="slides"
                maxWidth={1920}
                initialPreview={formData.media_url || null}
                onUpload={(url) => setFormData({...formData, media_url: url})} 
              />
            </div>
          </div>
        )}

        {formData.tipo === 'video' && (
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-manso-cream/60 ml-2 flex items-center gap-2">
              {getTipoIcon('video')}
              URL del Video
            </label>
            <div className="relative">
              <Video className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/60" size={20} />
              <input 
                type="url" 
                placeholder="URL DEL VIDEO (MP4)"
                className="w-full bg-manso-cream/10 p-4 pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all"
                value={formData.media_url}
                onChange={e => setFormData({...formData, media_url: e.target.value})}
                required
              />
            </div>
          </div>
        )}

        {formData.tipo === 'texto' && (
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-manso-cream/60 ml-2 flex items-center gap-2">
              {getTipoIcon('texto')}
              Contenido del Slide
            </label>
            <div className="bg-manso-cream/5 rounded-2xl p-4 border border-manso-cream/10 text-center text-manso-cream/40 text-xs">
              Los slides de tipo TEXTO no llevan imagen ni video
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {/* Tag */}
          <div className="relative">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/60" size={20} />
            <input 
              type="text" 
              placeholder="TAG (opcional)"
              className="w-full bg-manso-cream/10 p-4 pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all"
              value={formData.tag}
              onChange={e => setFormData({...formData, tag: e.target.value})}
            />
          </div>

          {/* Título Línea 1 */}
          <div className="relative">
            <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/60" size={20} />
            <input 
              type="text" 
              placeholder="TÍTULO LÍNEA 1 (requerido)"
              className="w-full bg-manso-cream/10 p-4 pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all"
              value={formData.title_line1}
              onChange={e => setFormData({...formData, title_line1: e.target.value})}
              required
            />
          </div>

          {/* Título Línea 2 */}
          <div className="relative">
            <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/60" size={20} />
            <input 
              type="text" 
              placeholder="TÍTULO LÍNEA 2 (opcional)"
              className="w-full bg-manso-cream/10 p-4 pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all"
              value={formData.title_line2}
              onChange={e => setFormData({...formData, title_line2: e.target.value})}
            />
          </div>

          {/* Descripción */}
          <div className="relative">
            <FileText className="absolute left-4 top-4 text-manso-cream/60" size={20} />
            <textarea 
              placeholder="DESCRIPCIÓN (opcional)"
              rows={3}
              className="w-full bg-manso-cream/10 p-4 pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all resize-none"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* Orden */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/60 text-[10px] font-black uppercase tracking-widest">
              #
            </div>
            <input 
              type="number" 
              placeholder="ORDEN (1, 2, 3...)"
              min="1"
              className="w-full bg-manso-cream/10 p-4 pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all"
              value={formData.order_index}
              onChange={e => setFormData({...formData, order_index: e.target.value})}
              required
            />
          </div>
        </div>

        {/* Botones dinamicos */}
        <div className="flex gap-4">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 bg-manso-cream/20 text-manso-cream py-5 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-manso-cream/30 transition-all active:scale-95"
            >
              Cancelar
            </button>
          )}
          <button 
            type="submit"
            disabled={loading}
            className="flex-1 bg-manso-terra text-manso-cream py-5 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50"
          >
            {loading
              ? (editingId ? 'ACTUALIZANDO...' : 'AGREGANDO...')
              : (editingId ? 'ACTUALIZAR SLIDE' : 'AGREGAR SLIDE')
            }
          </button>
        </div>
      </form>
    </div>
  );
}
