'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ImageUploader } from './ImageUploader';
import { SoundCloudPlayer } from '../ui/SoundCloudPlayer';
import { User, Music, Instagram, Globe, Eye } from 'lucide-react';

export function FormArtista() {
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [soundcloudError, setSoundcloudError] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    bio: '',
    imagen_url: '',
    instagram: '',
    spotify: '',
    soundcloud: ''
  });

  const validateSoundCloudUrl = (url: string) => {
    if (!url) return true; // Es opcional
    
    const soundCloudRegex = /^https?:\/\/(soundcloud\.com\/|snd\.sc\/)/;
    return soundCloudRegex.test(url);
  };

  const handleSoundCloudChange = (value: string) => {
    setFormData({...formData, soundcloud: value});
    
    if (value && !validateSoundCloudUrl(value)) {
      setSoundcloudError('URL inválida. Debe ser una URL de SoundCloud (soundcloud.com/...)');
      console.log('❌ URL inválida de SoundCloud:', value);
    } else {
      setSoundcloudError('');
      if (value) {
        console.log('✅ URL válida de SoundCloud:', value);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.imagen_url) {
      alert('Por favor, sube una imagen del artista.');
      return;
    }

    if (formData.soundcloud && !validateSoundCloudUrl(formData.soundcloud)) {
      alert('Por favor, corrige la URL de SoundCloud.');
      return;
    }

    setLoading(true);

    const artistaData = {
      nombre: formData.nombre,
      bio: formData.bio,
      imagen_url: formData.imagen_url,
      redes_sociales: {
        instagram: formData.instagram || null,
        spotify: formData.spotify || null,
        soundcloud: formData.soundcloud || null
      },
      active: true
    };

    const { error } = await supabase.from('artistas').insert([artistaData]);

    if (error) {
      alert(error.message);
    } else {
      alert('¡Artista agregado a Manso Club!');
      setFormData({ 
        nombre: '', 
        bio: '', 
        imagen_url: '', 
        instagram: '', 
        spotify: '', 
        soundcloud: '' 
      });
      window.location.reload();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-manso-cream/5 p-8 rounded-[2.5rem] border border-manso-cream/10 shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Zona de Carga de Imagen */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-manso-cream/60 ml-2">
            Foto del Artista
          </label>
          <ImageUploader 
            bucket="flyers" 
            onUpload={(url) => setFormData({...formData, imagen_url: url})} 
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Nombre del Artista */}
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/60" size={20} />
            <input 
              type="text" 
              placeholder="NOMBRE DEL ARTISTA"
              className="w-full bg-manso-cream/10 p-4 pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all"
              value={formData.nombre}
              onChange={e => setFormData({...formData, nombre: e.target.value})}
              required
            />
          </div>

          {/* Biografía */}
          <div className="relative">
            <Music className="absolute left-4 top-4 text-manso-cream/60" size={20} />
            <textarea 
              placeholder="BIOGRAFÍA / DESCRIPCIÓN"
              className="w-full bg-manso-cream/10 p-4 pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none h-32 resize-none text-manso-cream placeholder:text-manso-cream/40"
              value={formData.bio}
              onChange={e => setFormData({...formData, bio: e.target.value})}
            />
          </div>

          {/* Redes Sociales */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-manso-cream/60 ml-2">
              Redes Sociales (Opcional)
            </p>
            
            <div className="relative">
              <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/60" size={20} />
              <input 
                type="text" 
                placeholder="@usuario"
                className="w-full bg-manso-cream/10 p-4 pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-mono text-sm text-manso-cream placeholder:text-manso-cream/40"
                value={formData.instagram}
                onChange={e => setFormData({...formData, instagram: e.target.value})}
              />
            </div>

            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/60" size={20} />
              <input 
                type="text" 
                placeholder="URL de Spotify / SoundCloud / Web"
                className="w-full bg-manso-cream/10 p-4 pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-mono text-sm text-manso-cream placeholder:text-manso-cream/40"
                value={formData.spotify}
                onChange={e => setFormData({...formData, spotify: e.target.value})}
              />
            </div>

            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/60" size={20} />
              <input 
                type="text" 
                placeholder="https://soundcloud.com/usuario (perfil, playlist o track)"
                className={`w-full bg-manso-cream/10 p-4 pl-12 rounded-2xl border ${
                  soundcloudError 
                    ? 'border-red-500/50 focus:ring-red-500' 
                    : 'border-manso-cream/20 focus:ring-manso-terra'
                } outline-none font-mono text-sm text-manso-cream placeholder:text-manso-cream/40`}
                value={formData.soundcloud}
                onChange={e => handleSoundCloudChange(e.target.value)}
              />
            </div>
            
            {soundcloudError && (
              <p className="text-red-400 text-xs font-medium mt-2 ml-2">
                {soundcloudError}
              </p>
            )}
          </div>
        </div>

        {/* Botón de Acción */}
        <button 
          disabled={loading}
          className="w-full bg-manso-terra text-manso-cream py-5 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'AGREGANDO ARTISTA...' : 'AGREGAR ARTISTA'}
        </button>
      </form>

      {/* Vista previa del reproductor */}
      {formData.soundcloud && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-manso-cream/60">
              Vista previa del reproductor
            </p>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-3 py-1 bg-manso-cream/10 border border-manso-cream/20 rounded-full text-manso-cream/80 hover:bg-manso-cream/20 transition-colors"
            >
              <Eye size={12} />
              <span className="text-xs font-medium">
                {showPreview ? 'Ocultar' : 'Mostrar'}
              </span>
            </button>
          </div>
          
          {showPreview && (
            <div className="bg-manso-cream/5 rounded-2xl p-4 border border-manso-cream/10">
              <SoundCloudPlayer 
                url={formData.soundcloud} 
                autoPlay={false}
                showControls={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
