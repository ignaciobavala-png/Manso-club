'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Eye, EyeOff, Youtube } from 'lucide-react';

interface Video {
  id: string;
  titulo: string;
  youtube_url: string;
  descripcion?: string;
  orden: number;
  active: boolean;
}

export function MultimediaList({ refreshTrigger }: { refreshTrigger?: number }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchVideos(); }, [refreshTrigger]);

  const fetchVideos = async () => {
    const { data } = await supabase
      .from('multimedia_videos')
      .select('*')
      .order('orden', { ascending: true });
    setVideos(data || []);
    setLoading(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('multimedia_videos').update({ active: !active }).eq('id', id);
    setVideos(prev => prev.map(v => v.id === id ? { ...v, active: !active } : v));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este video?')) return;
    await supabase.from('multimedia_videos').delete().eq('id', id);
    setVideos(prev => prev.filter(v => v.id !== id));
  };

  if (loading) return <div className="text-manso-cream/60 text-center py-8">Cargando videos...</div>;

  return (
    <div className="space-y-3">
      <h3 className="text-base font-black uppercase tracking-tighter text-manso-cream flex items-center gap-2 mb-4">
        <Youtube size={18} /> Videos ({videos.length})
      </h3>
      {videos.length === 0 ? (
        <div className="text-manso-cream/40 text-sm text-center py-8">No hay videos todavía</div>
      ) : videos.map(video => (
        <div key={video.id} className={`p-4 rounded-2xl border transition-all ${
          video.active ? 'bg-manso-cream/10 border-manso-cream/20' : 'bg-manso-black/20 border-manso-cream/10 opacity-60'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-manso-cream font-bold text-sm truncate">{video.titulo}</p>
              <p className="text-manso-cream/40 text-xs font-mono truncate mt-0.5">{video.youtube_url}</p>
              {video.descripcion && (
                <p className="text-manso-cream/50 text-xs mt-1 line-clamp-1">{video.descripcion}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => toggleActive(video.id, video.active)}
                className={`p-2 rounded-lg transition-all ${video.active ? 'bg-green-500/20 ring-2 ring-green-500/30' : 'bg-red-500/20 ring-2 ring-red-500/30'}`}>
                {video.active ? <Eye size={14} className="text-green-400" /> : <EyeOff size={14} className="text-red-400" />}
              </button>
              <button onClick={() => handleDelete(video.id)}
                className="p-2 rounded-lg bg-red-500/20 ring-2 ring-red-500/30 transition-all">
                <Trash2 size={14} className="text-red-400" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
