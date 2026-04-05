'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Music, Edit, Trash2, Plus, Play, Pause } from 'lucide-react';

interface ArtistTrack {
  id: string;
  artista_id: string;
  titulo: string;
  soundcloud_url: string;
  orden: number;
  activo: boolean;
  created_at: string;
}

interface ArtistasTracksListProps {
  artistaId: string;
  artistaNombre: string;
  onEditTrack?: (track: ArtistTrack) => void;
  onNewTrack?: () => void;
  refreshTrigger?: number;
}

export function ArtistasTracksList({ 
  artistaId, 
  artistaNombre, 
  onEditTrack, 
  onNewTrack,
  refreshTrigger 
}: ArtistasTracksListProps) {
  const [tracks, setTracks] = useState<ArtistTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadTracks();
  }, [artistaId, refreshTrigger]);

  const loadTracks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('artistas_tracks')
        .select('*')
        .eq('artista_id', artistaId)
        .order('orden', { ascending: true });

      if (error) throw error;
      setTracks(data || []);
    } catch (error: any) {
      console.error('Error loading tracks:', error);
      alert('Error al cargar los tracks');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (track: ArtistTrack) => {
    try {
      setActionLoading(track.id);
      const { error } = await supabase
        .from('artistas_tracks')
        .update({ activo: !track.activo })
        .eq('id', track.id);

      if (error) throw error;
      
      setTracks(tracks.map(t => 
        t.id === track.id ? { ...t, activo: !track.activo } : t
      ));
    } catch (error: any) {
      console.error('Error toggling track:', error);
      alert('Error al actualizar el track');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (track: ArtistTrack) => {
    if (!confirm(`¿Estás seguro de eliminar "${track.titulo}"?`)) return;

    try {
      setActionLoading(track.id);
      const { error } = await supabase
        .from('artistas_tracks')
        .update({ activo: false })
        .eq('id', track.id);

      if (error) throw error;
      
      setTracks(tracks.map(t => 
        t.id === track.id ? { ...t, activo: false } : t
      ));
    } catch (error: any) {
      console.error('Error deleting track:', error);
      alert('Error al eliminar el track');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReorder = async (trackId: string, newOrden: number) => {
    try {
      setActionLoading(trackId);
      const { error } = await supabase
        .from('artistas_tracks')
        .update({ orden: newOrden })
        .eq('id', trackId);

      if (error) throw error;
      
      setTracks(tracks.map(t => 
        t.id === trackId ? { ...t, orden: newOrden } : t
      ).sort((a, b) => a.orden - b.orden));
    } catch (error: any) {
      console.error('Error reordering track:', error);
      alert('Error al reordenar el track');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-manso-cream/5 p-6 rounded-2xl border border-manso-cream/10">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-manso-cream/10 rounded w-1/3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-manso-cream/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-manso-cream/5 p-6 rounded-2xl border border-manso-cream/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tighter text-manso-cream">
            Tracks de {artistaNombre}
          </h3>
          <p className="text-sm text-manso-cream/60 mt-1">
            {tracks.filter(t => t.activo).length} tracks activos
          </p>
        </div>
        {onNewTrack && (
          <button
            onClick={onNewTrack}
            className="flex items-center gap-2 px-4 py-2 bg-manso-terra text-manso-cream rounded-full font-black uppercase tracking-wider text-xs hover:bg-manso-cream hover:text-manso-black transition-all"
          >
            <Plus size={14} />
            Nuevo Track
          </button>
        )}
      </div>

      {/* Lista de tracks */}
      {tracks.length === 0 ? (
        <div className="text-center py-12">
          <Music size={48} className="mx-auto text-manso-cream/20 mb-4" />
          <p className="text-manso-cream/60 font-medium">
            No hay tracks registrados
          </p>
          {onNewTrack && (
            <button
              onClick={onNewTrack}
              className="mt-4 text-manso-terra hover:text-manso-cream transition-colors font-medium"
            >
              Agregar el primer track
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {tracks.map((track, index) => (
            <div
              key={track.id}
              className={`p-4 rounded-xl border transition-all ${
                track.activo
                  ? 'bg-manso-cream/5 border-manso-cream/20'
                  : 'bg-manso-cream/2 border-manso-cream/10 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-manso-cream/40 text-xs font-mono">
                      #{track.orden}
                    </span>
                    <Music size={16} className="text-manso-terra" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium text-manso-cream truncate ${
                      !track.activo ? 'line-through' : ''
                    }`}>
                      {track.titulo}
                    </h4>
                    <p className="text-xs text-manso-cream/40 truncate">
                      {track.soundcloud_url}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Estado activo */}
                  <button
                    onClick={() => handleToggleActive(track)}
                    disabled={actionLoading === track.id}
                    className={`p-2 rounded-lg transition-colors ${
                      track.activo
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    }`}
                    title={track.activo ? 'Desactivar' : 'Activar'}
                  >
                    {track.activo ? <Play size={14} /> : <Pause size={14} />}
                  </button>

                  {/* Reordenar */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleReorder(track.id, Math.max(1, track.orden - 1))}
                      disabled={actionLoading === track.id || track.orden <= 1}
                      className="p-1 rounded text-manso-cream/40 hover:text-manso-cream disabled:opacity-30"
                      title="Subir"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleReorder(track.id, track.orden + 1)}
                      disabled={actionLoading === track.id}
                      className="p-1 rounded text-manso-cream/40 hover:text-manso-cream disabled:opacity-30"
                      title="Bajar"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Editar */}
                  {onEditTrack && (
                    <button
                      onClick={() => onEditTrack(track)}
                      className="p-2 rounded-lg bg-manso-cream/10 text-manso-cream hover:bg-manso-cream/20 transition-colors"
                      title="Editar"
                    >
                      <Edit size={14} />
                    </button>
                  )}

                  {/* Eliminar */}
                  <button
                    onClick={() => handleDelete(track)}
                    disabled={actionLoading === track.id}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
