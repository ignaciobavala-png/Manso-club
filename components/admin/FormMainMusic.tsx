'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Music, User, Link as LinkIcon, Hash } from 'lucide-react';

export function FormMainMusic() {
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    artista: '',
    soundcloud_url: '',
    orden: 0,
  });

  // Listen for edit events from the list
  useEffect(() => {
    const handleEdit = (event: CustomEvent<{ id: string; titulo: string; artista: string; soundcloud_url: string; orden: number }>) => {
      const item = event.detail;
      setEditingId(item.id);
      setFormData({
        titulo: item.titulo || '',
        artista: item.artista || '',
        soundcloud_url: item.soundcloud_url || '',
        orden: item.orden || 0,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('editMainMusic', handleEdit as EventListener);
    return () => {
      window.removeEventListener('editMainMusic', handleEdit as EventListener);
    };
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormData({ titulo: '', artista: '', soundcloud_url: '', orden: 0 });
  };

  const validateSoundCloudUrl = (url: string) => {
    if (!url) return false;
    return /^https?:\/\/(soundcloud\.com\/|snd\.sc\/)/.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSoundCloudUrl(formData.soundcloud_url)) {
      alert('URL inválida. Debe ser una URL de SoundCloud (soundcloud.com/...)');
      return;
    }

    setLoading(true);

    const data = {
      titulo: formData.titulo,
      artista: formData.artista,
      soundcloud_url: formData.soundcloud_url,
      orden: formData.orden,
      active: true,
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from('main_music')
          .update(data)
          .eq('id', editingId);
        if (error) throw error;
        alert('¡Track actualizado!');
      } else {
        const { error } = await supabase.from('main_music').insert([data]);
        if (error) throw error;
        alert('¡Track agregado al Home!');
      }

      resetForm();
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-manso-cream/5 border border-manso-cream/10 rounded-3xl p-6">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-manso-terra mb-4">
        {editingId ? '✏️ Editando Track' : '🎵 Nuevo Track para el Home'}
      </h3>

      {/* Título */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-manso-cream/60 mb-2 block">
          Título del Track
        </label>
        <div className="relative">
          <Music size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-manso-cream/40" />
          <input
            type="text"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            placeholder="Nombre del track o set"
            required
            className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-4 py-3 pl-10 text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra/50 transition-colors"
          />
        </div>
      </div>

      {/* Artista */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-manso-cream/60 mb-2 block">
          Artista
        </label>
        <div className="relative">
          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-manso-cream/40" />
          <input
            type="text"
            value={formData.artista}
            onChange={(e) => setFormData({ ...formData, artista: e.target.value })}
            placeholder="Nombre del artista"
            required
            className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-4 py-3 pl-10 text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra/50 transition-colors"
          />
        </div>
      </div>

      {/* SoundCloud URL */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-manso-cream/60 mb-2 block">
          URL de SoundCloud
        </label>
        <div className="relative">
          <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-manso-cream/40" />
          <input
            type="url"
            value={formData.soundcloud_url}
            onChange={(e) => setFormData({ ...formData, soundcloud_url: e.target.value })}
            placeholder="https://soundcloud.com/artista/track"
            required
            className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-4 py-3 pl-10 text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra/50 transition-colors"
          />
        </div>
      </div>

      {/* Orden */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-manso-cream/60 mb-2 block">
          Orden (menor = primero)
        </label>
        <div className="relative">
          <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-manso-cream/40" />
          <input
            type="number"
            value={formData.orden}
            onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
            className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-4 py-3 pl-10 text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra/50 transition-colors"
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-manso-terra text-manso-cream py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-manso-terra/80 transition-all disabled:opacity-50"
        >
          {loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Agregar Track'}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-3 bg-manso-cream/10 text-manso-cream/60 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-manso-cream/20 transition-all"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
