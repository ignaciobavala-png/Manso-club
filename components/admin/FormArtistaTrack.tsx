'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SoundCloudPlayer } from '../ui/SoundCloudPlayer';
import { Music, X, Save, Plus } from 'lucide-react';

interface ArtistTrack {
  id?: string;
  artista_id: string;
  titulo: string;
  soundcloud_url: string;
  orden: number | string;
  activo: boolean;
}

interface FormArtistaTrackProps {
  artistaId: string;
  artistaNombre: string;
  track?: ArtistTrack;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export function FormArtistaTrack({ 
  artistaId, 
  artistaNombre, 
  track, 
  isOpen, 
  onClose, 
  onSave 
}: FormArtistaTrackProps) {
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [soundcloudError, setSoundcloudError] = useState('');
  const [nextOrden, setNextOrden] = useState(1);
  const [formData, setFormData] = useState({
    titulo: '',
    soundcloud_url: '',
    orden: '1',
    activo: true
  });

  useEffect(() => {
    if (track) {
      // Modo edición
      setFormData({
        titulo: track.titulo,
        soundcloud_url: track.soundcloud_url,
        orden: track.orden.toString(),
        activo: track.activo
      });
    } else {
      // Modo creación - obtener siguiente orden
      getNextOrden();
      setFormData({
        titulo: '',
        soundcloud_url: '',
        orden: nextOrden.toString(),
        activo: true
      });
    }
  }, [track, artistaId]);

  const getNextOrden = async () => {
    try {
      const { data, error } = await supabase
        .from('artistas_tracks')
        .select('orden')
        .eq('artista_id', artistaId)
        .order('orden', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      const maxOrden = data?.[0]?.orden || 0;
      setNextOrden(maxOrden + 1);
      setFormData(prev => ({ ...prev, orden: (maxOrden + 1).toString() }));
    } catch (error) {
      console.error('Error getting next orden:', error);
    }
  };

  const validateSoundCloudUrl = (url: string) => {
    if (!url) return true; // Es opcional
    
    const soundCloudRegex = /^https?:\/\/(soundcloud\.com\/|snd\.sc\/)/;
    return soundCloudRegex.test(url);
  };

  const handleSoundCloudChange = (value: string) => {
    setFormData({...formData, soundcloud_url: value});
    
    if (value && !validateSoundCloudUrl(value)) {
      setSoundcloudError('URL inválida. Debe ser una URL de SoundCloud (soundcloud.com/...)');
    } else {
      setSoundcloudError('');
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      soundcloud_url: '',
      orden: nextOrden.toString(),
      activo: true
    });
    setSoundcloudError('');
    setShowPreview(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.soundcloud_url && !validateSoundCloudUrl(formData.soundcloud_url)) {
      alert('Por favor, corrige la URL de SoundCloud.');
      return;
    }

    if (!formData.titulo.trim()) {
      alert('El título es obligatorio.');
      return;
    }

    setLoading(true);

    const trackData = {
      artista_id: artistaId,
      titulo: formData.titulo.trim(),
      soundcloud_url: formData.soundcloud_url.trim() || null,
      orden: parseInt(String(formData.orden)) || 0,
      activo: formData.activo
    };

    try {
      if (track?.id) {
        // Modo edición
        const { error } = await supabase
          .from('artistas_tracks')
          .update(trackData)
          .eq('id', track.id);

        if (error) throw error;
        alert('¡Track actualizado correctamente!');
      } else {
        // Modo creación
        const { error } = await supabase.from('artistas_tracks').insert([trackData]);

        if (error) throw error;
        alert('¡Track agregado correctamente!');
      }

      resetForm();
      onClose();
      onSave?.();
    } catch (error: any) {
      alert(error.message);
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-manso-black rounded-[2.5rem] border border-manso-cream/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-manso-cream/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-manso-cream">
                {track ? 'Editar Track' : 'Nuevo Track'}
              </h2>
              <p className="text-sm text-manso-cream/60 mt-1">
                {artistaNombre} - Track #{formData.orden}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-manso-cream/10 text-manso-cream hover:bg-manso-cream/20 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Título */}
          <div className="relative">
            <Music className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/60" size={20} />
            <input 
              type="text" 
              placeholder="TÍTULO DEL TRACK"
              className="w-full bg-manso-cream/10 p-4 pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all"
              value={formData.titulo}
              onChange={e => setFormData({...formData, titulo: e.target.value})}
              required
            />
          </div>

          {/* URL de SoundCloud */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-manso-cream/60 ml-2">
              URL de SoundCloud
            </label>
            <div className="relative">
              <Music className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/60" size={20} />
              <input 
                type="text" 
                placeholder="https://soundcloud.com/usuario/track"
                className={`w-full bg-manso-cream/10 p-4 pl-12 rounded-2xl border ${
                  soundcloudError 
                    ? 'border-red-500/50 focus:ring-red-500' 
                    : 'border-manso-cream/20 focus:ring-manso-terra'
                } outline-none font-mono text-sm text-manso-cream placeholder:text-manso-cream/40`}
                value={formData.soundcloud_url}
                onChange={e => handleSoundCloudChange(e.target.value)}
              />
            </div>
            
            {soundcloudError && (
              <p className="text-red-400 text-xs font-medium mt-2 ml-2">
                {soundcloudError}
              </p>
            )}
          </div>

          {/* Orden y Estado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-manso-cream/60 ml-2">
                Orden
              </label>
              <input 
                type="number" 
                min="1"
                className="w-full bg-manso-cream/10 p-4 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all"
                value={formData.orden}
                onChange={e => setFormData({...formData, orden: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-manso-cream/60 ml-2">
                Estado
              </label>
              <div className="flex items-center gap-3 p-4 bg-manso-cream/10 rounded-2xl border border-manso-cream/20">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, activo: !formData.activo})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.activo ? 'bg-manso-terra' : 'bg-manso-cream/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-manso-cream transition-transform ${
                      formData.activo ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-manso-cream">
                  {formData.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>

          {/* Vista previa del reproductor */}
          {formData.soundcloud_url && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-manso-cream/60">
                  Vista previa del reproductor
                </p>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-3 py-1 bg-manso-cream/10 border border-manso-cream/20 rounded-full text-manso-cream/80 hover:bg-manso-cream/20 transition-colors"
                >
                  {showPreview ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              
              {showPreview && (
                <div className="bg-manso-cream/5 rounded-2xl p-4 border border-manso-cream/10">
                  <SoundCloudPlayer 
                    url={formData.soundcloud_url} 
                    autoPlay={false}
                    showControls={true}
                  />
                </div>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-manso-cream/20 text-manso-cream py-4 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-manso-cream/30 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 bg-manso-terra text-manso-cream py-4 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-manso-cream/30 border-t-manso-cream rounded-full animate-spin"></div>
                  {track ? 'ACTUALIZANDO...' : 'AGREGANDO...'}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {track ? 'ACTUALIZAR TRACK' : 'AGREGAR TRACK'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
