'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ImageUploader } from './ImageUploader';
import { ImageIcon, Hash } from 'lucide-react';

export function FormGallery() {
  const [loading, setLoading] = useState(false);
  const [imageKey, setImageKey] = useState(0);
  const [formData, setFormData] = useState({
    photo_url: '',
    order_index: '1'
  });

  const resetForm = () => {
    setFormData({ photo_url: '', order_index: '1' });
    setImageKey(prev => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Obtener el orden más alto actual
      const { data: maxOrderData } = await supabase
        .from('gallery_images')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrder = parseInt(String(formData.order_index)) || 1;
      const maxOrder = maxOrderData?.[0]?.order_index || 0;
      const finalOrder = nextOrder > maxOrder ? nextOrder : maxOrder + 1;

      const { error } = await supabase
        .from('gallery_images')
        .insert({
          photo_url: formData.photo_url,
          order_index: finalOrder,
          active: true
        });
      
      if (error) throw error;

      alert('¡Imagen agregada correctamente a la galería!');
      resetForm();
      window.dispatchEvent(new CustomEvent('dashboardRefresh'));
    } catch (error: any) {
      alert(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-manso-cream/5 p-8 rounded-[2.5rem] border border-manso-cream/10 shadow-xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-manso-cream mb-2">
          Nueva Imagen de Galería
        </h2>
        <p className="text-sm text-manso-cream/60">
          Agrega una nueva imagen a la galería del sitio
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Zona de Carga de Imagen */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-manso-cream/60 ml-2 flex items-center gap-2">
            <ImageIcon size={16} />
            Imagen de la Galería
          </label>
          <ImageUploader
            key={imageKey}
            bucket="gallery-images"
            folder="gallery"
            maxWidth={1920}
            initialPreview={formData.photo_url || null}
            onUpload={(url) => setFormData({...formData, photo_url: url})} 
          />
        </div>

        {/* Orden */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/60 text-[10px] font-black uppercase tracking-widest">
            #
          </div>
          <input 
            type="number" 
            placeholder="ORDEN (opcional, se asignará automáticamente)"
            min="1"
            className="w-full bg-manso-cream/10 p-4 pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all"
            value={formData.order_index}
            onChange={e => setFormData({...formData, order_index: e.target.value})}
          />
        </div>

        {/* Boton de submit */}
        <button 
          type="submit"
          disabled={loading || !formData.photo_url}
          className="w-full bg-manso-terra text-manso-cream py-5 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'AGREGANDO...' : 'AGREGAR IMAGEN'}
        </button>
      </form>
    </div>
  );
}
