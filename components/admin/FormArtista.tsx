'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ImageUploader } from './ImageUploader';
import { SoundCloudPlayer } from '../ui/SoundCloudPlayer';
import { ArtistasTracksList } from './ArtistasTracksList';
import { ArtistaFotosList } from './ArtistaFotosList';
import { FormArtistaTrack } from './FormArtistaTrack';
import { User, Music, Instagram, Globe, Eye } from 'lucide-react';

interface ArtistaEdit {
  id: string;
  nombre: string;
  bio?: string;
  estilo?: string;
  imagen_url?: string;
  soundcloud_url?: string;
  tipo?: string;
  social_links?: {
    instagram?: string;
    spotify?: string;
    soundcloud?: string;
  };
  // Legacy compat
  redes_sociales?: {
    instagram?: string;
    spotify?: string;
    soundcloud?: string;
  };
  active: boolean;
}

export function FormArtista() {
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [soundcloudError, setSoundcloudError] = useState('');
  const [imageKey, setImageKey] = useState(0);
  const [tracksRefreshTrigger, setTracksRefreshTrigger] = useState(0);
  const [fotosRefreshTrigger, setFotosRefreshTrigger] = useState(0);
  const [showTrackForm, setShowTrackForm] = useState(false);
  const [editingTrack, setEditingTrack] = useState<any>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    bio: '',
    estilo: '',
    imagen_url: '',
    instagram: '',
    spotify: '',
    soundcloud: '',
    tipo: 'DJ'
  });

  useEffect(() => {
    const handleEditEvent = (event: CustomEvent<ArtistaEdit>) => {
      const artista = event.detail;
      setEditingId(artista.id);
      const links = artista.social_links || artista.redes_sociales;
      setFormData({
        nombre: artista.nombre || '',
        bio: artista.bio || '',
        estilo: artista.estilo || '',
        imagen_url: artista.imagen_url || '',
        instagram: links?.instagram || '',
        spotify: links?.spotify || '',
        soundcloud: artista.soundcloud_url || links?.soundcloud || '',
        tipo: artista.tipo || 'DJ'
      });
      setImageKey(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('editArtista', handleEditEvent as EventListener);
    return () => {
      window.removeEventListener('editArtista', handleEditEvent as EventListener);
    };
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormData({ nombre: '', bio: '', estilo: '', imagen_url: '', instagram: '', spotify: '', soundcloud: '', tipo: 'DJ' });
    setImageKey(prev => prev + 1);
    setSoundcloudError('');
    setTracksRefreshTrigger(prev => prev + 1);
    setFotosRefreshTrigger(prev => prev + 1);
  };

  const validateSoundCloudUrl = (url: string) => {
    if (!url) return true; // Es opcional
    
    const soundCloudRegex = /^https?:\/\/(soundcloud\.com\/|snd\.sc\/)/;
    return soundCloudRegex.test(url);
  };

  const handleSoundCloudChange = (value: string) => {
    setFormData({...formData, soundcloud: value});
    
    if (value && !validateSoundCloudUrl(value)) {
      setSoundcloudError('URL inválida. Debe ser una URL de SoundCloud (soundcloud.com/...)');
    } else {
      setSoundcloudError('');
    }
  };

  const handleNewTrack = () => {
    setEditingTrack(null);
    setShowTrackForm(true);
  };

  const handleEditTrack = (track: any) => {
    setEditingTrack(track);
    setShowTrackForm(true);
  };

  const handleTrackFormClose = () => {
    setShowTrackForm(false);
    setEditingTrack(null);
  };

  const handleTrackSaved = () => {
    setTracksRefreshTrigger(prev => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.soundcloud && !validateSoundCloudUrl(formData.soundcloud)) {
      alert('Por favor, corrige la URL de SoundCloud.');
      return;
    }

    setLoading(true);

    const slug = formData.nombre
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const artistaData: Record<string, unknown> = {
      nombre: formData.nombre,
      slug,
      bio: formData.bio || null,
      estilo: formData.estilo || null,
      imagen_url: formData.imagen_url || null,
      soundcloud_url: formData.soundcloud || null,
      tipo: formData.tipo,
      social_links: {
        instagram: formData.instagram || null,
        spotify: formData.spotify || null,
        soundcloud: formData.soundcloud || null
      },
      active: true
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from('artistas')
          .update(artistaData)
          .eq('id', editingId);

        if (error) throw error;
        alert('¡Artista actualizado correctamente!');
      } else {
        const { error } = await supabase.from('artistas').insert([artistaData]);

        if (error) throw error;
        alert('¡Artista agregado a Manso Club!');
      }

      resetForm();
      window.dispatchEvent(new CustomEvent('dashboardRefresh'));
      
      // Revalidar cache
      try {
        const response = await fetch('/api/revalidate', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` }
        });
        
        if (!response.ok) {
          console.error('Error en revalidación artistas:', response.status);
        } else {
          console.log('✅ Cache artistas revalidado');
        }
      } catch (error) {
        console.error('❌ Error revalidando cache artistas:', error);
      }
    } catch (error: any) {
      alert(error.message);
    }

    setLoading(false);
  };

  return (
    <>
      <div className="max-w-2xl mx-auto bg-manso-cream/5 p-8 rounded-[2.5rem] border border-manso-cream/10 shadow-xl">
        {/* Header dinamico */}
        <div className="mb-6">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-manso-cream mb-2">
            {editingId ? 'Editar Artista' : 'Nuevo Artista'}
          </h2>
          {editingId && (
            <p className="text-sm text-manso-cream/60">
              Modificando el perfil de {formData.nombre}
            </p>
          )}
        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Zona de Carga de Imagen */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-manso-cream/60 ml-2">
            Foto del Artista
          </label>
          <ImageUploader
            key={imageKey}
            bucket="artist" 
            folder="profiles"
            maxWidth={1200}
            initialPreview={formData.imagen_url || null}
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

          {/* Tipo de Artista */}
          <div className="relative">
            <select
              className="w-full bg-manso-cream/10 p-4 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream"
              value={formData.tipo}
              onChange={e => setFormData({...formData, tipo: e.target.value})}
            >
              <option value="DJ">DJ</option>
              <option value="Artista Visual">Artista Visual</option>
            </select>
          </div>

          {/* Estilo / Género */}
          <div className="relative">
            <Music className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/60" size={20} />
            <input 
              type="text" 
              placeholder="ESTILO / GÉNERO (ej: Techno / House)"
              className="w-full bg-manso-cream/10 p-4 pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all"
              value={formData.estilo}
              onChange={e => setFormData({...formData, estilo: e.target.value})}
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
              ? (editingId ? 'ACTUALIZANDO...' : 'AGREGANDO ARTISTA...')
              : (editingId ? 'ACTUALIZAR ARTISTA' : 'AGREGAR ARTISTA')
            }
          </button>
        </div>
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

    {/* Gestión de tracks - solo visible cuando se está editando */}
    {editingId && (
      <div className="mt-8">
        <ArtistasTracksList
          artistaId={editingId}
          artistaNombre={formData.nombre}
          onEditTrack={handleEditTrack}
          onNewTrack={handleNewTrack}
          refreshTrigger={tracksRefreshTrigger}
        />
      </div>
    )}

    {/* Galería de fotos — solo visible cuando se está editando */}
    {editingId && (
      <div className="mt-8">
        <ArtistaFotosList
          artistaId={editingId}
          artistaNombre={formData.nombre}
          refreshTrigger={fotosRefreshTrigger}
        />
      </div>
    )}

    {/* Formulario de tracks */}
    {showTrackForm && (
      <FormArtistaTrack
        artistaId={editingId!}
        artistaNombre={formData.nombre}
        track={editingTrack}
        isOpen={showTrackForm}
        onClose={handleTrackFormClose}
        onSave={handleTrackSaved}
      />
    )}
    </>
  );
}
