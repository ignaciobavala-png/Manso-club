'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ImageUploader } from './ImageUploader';
import { ImageIcon } from 'lucide-react';

export function FormMembresiaGallery() {
  const [loading, setLoading] = useState(false);
  const [imageKey, setImageKey] = useState(0);
  const [photoUrl, setPhotoUrl] = useState('');

  const resetForm = () => {
    setPhotoUrl('');
    setImageKey(prev => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: maxOrderData } = await supabase
        .from('membresias_gallery')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1);

      const maxOrder = maxOrderData?.[0]?.order_index || 0;

      const { error } = await supabase
        .from('membresias_gallery')
        .insert({ photo_url: photoUrl, order_index: maxOrder + 1, active: true });

      if (error) throw error;

      alert('¡Foto agregada a la galería de membresías!');
      resetForm();
      window.dispatchEvent(new CustomEvent('dashboardRefresh'));
    } catch (err: any) {
      alert(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="bg-manso-cream/5 p-6 rounded-[2rem] border border-manso-cream/10 shadow-xl">
      <div className="mb-5">
        <h2 className="text-lg font-black uppercase tracking-tighter text-manso-cream mb-1">
          Galería Cowork
        </h2>
        <p className="text-xs text-manso-cream/50">
          Fotos que aparecen en la sección membresías del sitio
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-manso-cream/60 ml-2 flex items-center gap-2">
            <ImageIcon size={14} />
            Foto del Cowork
          </label>
          <ImageUploader
            key={imageKey}
            bucket="membresias-gallery"
            folder="photos"
            maxWidth={1920}
            initialPreview={photoUrl || null}
            onUpload={setPhotoUrl}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !photoUrl}
          className="w-full bg-manso-terra text-manso-cream py-4 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? 'AGREGANDO...' : 'AGREGAR FOTO'}
        </button>
      </form>
    </div>
  );
}
