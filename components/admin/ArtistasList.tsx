'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit2, Trash2, Eye, EyeOff, User } from 'lucide-react';

interface Artista {
  id: string;
  nombre: string;
  bio?: string;
  imagen_url?: string;
  redes_sociales?: {
    instagram?: string;
    spotify?: string;
    soundcloud?: string;
  };
  active: boolean;
  created_at: string;
}

export function ArtistasList() {
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtistas();
  }, []);

  const fetchArtistas = async () => {
    const { data, error } = await supabase
      .from('artistas')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setArtistas(data || []);
    }
    setLoading(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase
      .from('artistas')
      .update({ active: !active })
      .eq('id', id);

    if (error) {
      alert('Error al actualizar estado: ' + error.message);
    } else {
      setArtistas(prev =>
        prev.map(a => a.id === id ? { ...a, active: !a.active } : a)
      );
    }
  };

  const handleEdit = (artista: Artista) => {
    window.dispatchEvent(new CustomEvent('editArtista', { detail: artista }));
  };

  const handleDelete = async (artista: Artista) => {
    if (!confirm(`¿Eliminar a ${artista.nombre}? Esta acción no se puede deshacer.`)) return;

    const { error } = await supabase
      .from('artistas')
      .delete()
      .eq('id', artista.id);

    if (error) {
      alert('Error al eliminar: ' + error.message);
      return;
    }

    // Borrar imagen del storage si existe
    if (artista.imagen_url?.includes('storage/v1/object/public/')) {
      const bucketMatch = artista.imagen_url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
      if (bucketMatch) {
        const [, bucketName, filePath] = bucketMatch;
        await supabase.storage.from(bucketName).remove([filePath]);
      }
    }

    setArtistas(prev => prev.filter(a => a.id !== artista.id));
  };

  if (loading) {
    return <div className="text-manso-cream/60 text-center py-8">Cargando artistas...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-black uppercase tracking-tighter text-manso-cream mb-6 flex items-center gap-2">
        <User size={20} />
        Comunidad de Artistas ({artistas.length})
      </h3>

      {artistas.length === 0 ? (
        <div className="text-center text-manso-cream/40 py-8">
          No hay artistas registrados
        </div>
      ) : (
        artistas.map((artista) => (
          <div
            key={artista.id}
            className={`p-4 rounded-2xl border transition-all ${
              artista.active
                ? 'bg-manso-cream/10 border-manso-cream/20'
                : 'bg-manso-black/20 border-manso-cream/10 opacity-60'
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Foto */}
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-manso-cream/5">
                {artista.imagen_url ? (
                  <img
                    src={artista.imagen_url}
                    alt={artista.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={24} className="text-manso-cream/30" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className={`text-lg font-bold uppercase tracking-tighter text-manso-cream ${
                  !artista.active ? 'line-through decoration-1 decoration-manso-cream/50' : ''
                }`}>
                  {artista.nombre}
                </h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  {artista.redes_sociales?.instagram && (
                    <span className="text-[9px] uppercase tracking-widest text-manso-cream/60 px-2 py-0.5 border border-manso-cream/20 rounded">
                      @{artista.redes_sociales.instagram.replace('@', '')}
                    </span>
                  )}
                  {artista.redes_sociales?.soundcloud && (
                    <span className="text-[9px] uppercase tracking-widest text-manso-terra px-2 py-0.5 border border-manso-terra/30 rounded">
                      SoundCloud
                    </span>
                  )}
                  {!artista.active && (
                    <span className="text-[9px] uppercase font-bold text-red-400 px-2 py-0.5 border border-red-400/30 rounded">
                      Inactivo
                    </span>
                  )}
                </div>
                {artista.bio && (
                  <p className="text-[10px] text-manso-cream/50 mt-1 line-clamp-1">
                    {artista.bio}
                  </p>
                )}
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleEdit(artista)}
                  className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 ring-2 ring-blue-500/30 transition-all"
                  title="Editar artista"
                >
                  <Edit2 size={14} className="text-blue-400" />
                </button>

                <button
                  onClick={() => toggleActive(artista.id, artista.active)}
                  className={`p-2 rounded-lg transition-all ${
                    artista.active
                      ? 'bg-green-500/20 hover:bg-green-500/30 ring-2 ring-green-500/30'
                      : 'bg-red-500/20 hover:bg-red-500/30 ring-2 ring-red-500/30'
                  }`}
                  title={artista.active ? 'Desactivar artista' : 'Activar artista'}
                >
                  {artista.active ? (
                    <Eye size={14} className="text-green-400" />
                  ) : (
                    <EyeOff size={14} className="text-red-400" />
                  )}
                </button>

                <button
                  onClick={() => handleDelete(artista)}
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 ring-2 ring-red-500/30 transition-all"
                  title="Eliminar artista"
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
