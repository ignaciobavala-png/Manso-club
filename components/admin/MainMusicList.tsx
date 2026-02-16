'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Music, Pencil, Trash2, ExternalLink } from 'lucide-react';

interface MainMusicTrack {
  id: string;
  titulo: string;
  artista: string;
  soundcloud_url: string;
  orden: number;
  active: boolean;
  created_at: string;
}

export function MainMusicList() {
  const [tracks, setTracks] = useState<MainMusicTrack[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTracks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('main_music')
      .select('*')
      .order('orden', { ascending: true });

    if (!error && data) {
      setTracks(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  const handleDelete = async (id: string, titulo: string) => {
    if (!confirm(`¿Eliminar "${titulo}" del reproductor del Home?`)) return;

    const { error } = await supabase.from('main_music').delete().eq('id', id);
    if (error) {
      alert(error.message);
    } else {
      setTracks(tracks.filter((t) => t.id !== id));
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('main_music')
      .update({ active: !currentActive })
      .eq('id', id);

    if (!error) {
      setTracks(tracks.map((t) => (t.id === id ? { ...t, active: !currentActive } : t)));
    }
  };

  const handleEdit = (track: MainMusicTrack) => {
    const event = new CustomEvent('editMainMusic', { detail: track });
    window.dispatchEvent(event);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-manso-terra/30 border-t-manso-terra rounded-full animate-spin" />
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="text-center py-12 bg-manso-cream/5 border border-manso-cream/10 rounded-3xl">
        <Music size={32} className="text-manso-cream/20 mx-auto mb-3" />
        <p className="text-sm text-manso-cream/40">No hay tracks cargados para el Home</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tracks.map((track, index) => (
        <div
          key={track.id}
          className={`bg-manso-cream/5 border border-manso-cream/10 rounded-2xl p-4 transition-all hover:border-manso-cream/20 ${
            !track.active ? 'opacity-50' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 bg-manso-terra/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-black text-manso-terra">{index + 1}</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-manso-cream truncate">{track.titulo}</h4>
                <p className="text-[10px] font-bold uppercase tracking-widest text-manso-cream/50">
                  {track.artista}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <a
                href={track.soundcloud_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center text-manso-cream/40 hover:text-manso-cream transition-colors"
                title="Abrir en SoundCloud"
              >
                <ExternalLink size={14} />
              </a>
              <button
                onClick={() => handleToggleActive(track.id, track.active)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                  track.active
                    ? 'text-green-400 hover:bg-green-400/10'
                    : 'text-manso-cream/30 hover:bg-manso-cream/10'
                }`}
                title={track.active ? 'Desactivar' : 'Activar'}
              >
                <div className={`w-2 h-2 rounded-full ${track.active ? 'bg-green-400' : 'bg-manso-cream/30'}`} />
              </button>
              <button
                onClick={() => handleEdit(track)}
                className="w-8 h-8 flex items-center justify-center text-manso-cream/40 hover:text-manso-terra transition-colors"
                title="Editar"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDelete(track.id, track.titulo)}
                className="w-8 h-8 flex items-center justify-center text-manso-cream/40 hover:text-red-400 transition-colors"
                title="Eliminar"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
