'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Eye, EyeOff, Youtube, Film, Image as ImageIcon, ExternalLink, Lock } from 'lucide-react';

interface MultimediaItem {
  id: string;
  titulo: string;
  youtube_url?: string;
  archivo_url?: string;
  descripcion?: string;
  tipo: string;
  orden: number;
  active: boolean;
  permitir_youtube?: boolean;
}

const TIPO_META: Record<string, { icon: typeof Youtube; label: string }> = {
  youtube: { icon: Youtube, label: 'YouTube' },
  video: { icon: Film, label: 'Video' },
  imagen: { icon: ImageIcon, label: 'Foto' },
};

function deleteFromStorage(url: string) {
  if (!url?.includes('storage/v1/object/public/')) return;
  const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
  if (match) {
    const [, bucket, filePath] = match;
    supabase.storage.from(bucket).remove([filePath]);
  }
}

export function MultimediaList({ refreshTrigger }: { refreshTrigger?: number }) {
  const [items, setItems] = useState<MultimediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchItems(); }, [refreshTrigger]);

  const fetchItems = async () => {
    const { data } = await supabase
      .from('multimedia_videos')
      .select('*')
      .order('orden', { ascending: true });
    setItems(data || []);
    setLoading(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('multimedia_videos').update({ active: !active }).eq('id', id);
    setItems(prev => prev.map(v => v.id === id ? { ...v, active: !active } : v));
  };

  const togglePermitirYoutube = async (id: string, permitirYoutube: boolean) => {
    await supabase.from('multimedia_videos').update({ permitir_youtube: !permitirYoutube }).eq('id', id);
    setItems(prev => prev.map(v => v.id === id ? { ...v, permitir_youtube: !permitirYoutube } : v));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este contenido?')) return;

    const item = items.find(v => v.id === id);
    if (item?.archivo_url) deleteFromStorage(item.archivo_url);

    await supabase.from('multimedia_videos').delete().eq('id', id);
    setItems(prev => prev.filter(v => v.id !== id));
  };

  if (loading) return <div className="text-manso-cream/60 text-center py-8">Cargando...</div>;

  return (
    <div className="space-y-3">
      <h3 className="text-base font-black uppercase tracking-tighter text-manso-cream flex items-center gap-2 mb-4">
        <ImageIcon size={18} /> Contenidos ({items.length})
      </h3>
      {items.length === 0 ? (
        <div className="text-manso-cream/40 text-sm text-center py-8">No hay contenido todavía</div>
      ) : items.map(item => {
        const meta = TIPO_META[item.tipo] || TIPO_META.youtube;
        const Icon = meta.icon;
        return (
          <div key={item.id} className={`p-4 rounded-2xl border transition-all ${
            item.active ? 'bg-manso-cream/10 border-manso-cream/20' : 'bg-manso-black/20 border-manso-cream/10 opacity-60'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Preview thumbnail */}
                {item.tipo === 'imagen' && item.archivo_url && (
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-manso-cream/10">
                    <img src={item.archivo_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                {item.tipo === 'video' && item.archivo_url && (
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-manso-cream/10 flex items-center justify-center">
                    <video src={item.archivo_url} className="w-full h-full object-cover" muted preload="metadata" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="text-manso-terra shrink-0" />
                    <p className="text-manso-cream font-bold text-sm truncate">{item.titulo}</p>
                  </div>
                  <p className="text-manso-cream/40 text-xs font-mono truncate mt-0.5">
                    {item.tipo === 'youtube' ? item.youtube_url : meta.label}
                  </p>
                  {item.descripcion && (
                    <p className="text-manso-cream/50 text-xs mt-1 line-clamp-1">{item.descripcion}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.tipo === 'youtube' && (
                  <button
                    onClick={() => togglePermitirYoutube(item.id, !!item.permitir_youtube)}
                    title={item.permitir_youtube ? 'Lleva a YouTube (click para bloquear)' : 'Bloqueado en la página (click para permitir link a YouTube)'}
                    className={`p-2 rounded-lg transition-all ${item.permitir_youtube ? 'bg-blue-500/20 ring-2 ring-blue-500/30' : 'bg-manso-cream/10 ring-2 ring-manso-cream/15'}`}
                  >
                    {item.permitir_youtube ? <ExternalLink size={14} className="text-blue-400" /> : <Lock size={14} className="text-manso-cream/50" />}
                  </button>
                )}
                <button onClick={() => toggleActive(item.id, item.active)}
                  className={`p-2 rounded-lg transition-all ${item.active ? 'bg-green-500/20 ring-2 ring-green-500/30' : 'bg-red-500/20 ring-2 ring-red-500/30'}`}>
                  {item.active ? <Eye size={14} className="text-green-400" /> : <EyeOff size={14} className="text-red-400" />}
                </button>
                <button onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-lg bg-red-500/20 ring-2 ring-red-500/30 transition-all">
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
