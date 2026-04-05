'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ImageUploader } from './ImageUploader';
import { Trash2, Images } from 'lucide-react';

interface ArtistaFoto {
  id: string;
  artista_id: string;
  url: string;
  orden: number;
  created_at: string;
}

interface Props {
  artistaId: string;
  artistaNombre: string;
  refreshTrigger?: number;
}

export function ArtistaFotosList({ artistaId, artistaNombre, refreshTrigger }: Props) {
  const [fotos, setFotos] = useState<ArtistaFoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [uploaderKey, setUploaderKey] = useState(0);

  useEffect(() => {
    loadFotos();
  }, [artistaId, refreshTrigger]);

  const loadFotos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('artista_fotos')
      .select('*')
      .eq('artista_id', artistaId)
      .order('orden', { ascending: true });

    if (error) console.error('Error loading fotos:', error);
    setFotos(data || []);
    setLoading(false);
  };

  const handleUpload = async (url: string) => {
    const nextOrden = fotos.length > 0 ? Math.max(...fotos.map(f => f.orden)) + 1 : 0;

    const { data, error } = await supabase
      .from('artista_fotos')
      .insert([{ artista_id: artistaId, url, orden: nextOrden }])
      .select()
      .single();

    if (error) {
      alert('Error al guardar la foto');
      return;
    }

    setFotos(prev => [...prev, data]);
    setUploaderKey(prev => prev + 1);
  };

  const handleDelete = async (foto: ArtistaFoto) => {
    if (!confirm('¿Eliminar esta foto de la galería?')) return;

    setActionLoading(foto.id);
    const { error } = await supabase
      .from('artista_fotos')
      .delete()
      .eq('id', foto.id);

    if (error) {
      alert('Error al eliminar la foto');
    } else {
      setFotos(prev => prev.filter(f => f.id !== foto.id));
    }
    setActionLoading(null);
  };

  const handleReorder = async (fotoId: string, newOrden: number) => {
    setActionLoading(fotoId);
    const { error } = await supabase
      .from('artista_fotos')
      .update({ orden: newOrden })
      .eq('id', fotoId);

    if (!error) {
      setFotos(prev =>
        prev.map(f => f.id === fotoId ? { ...f, orden: newOrden } : f)
          .sort((a, b) => a.orden - b.orden)
      );
    }
    setActionLoading(null);
  };

  return (
    <div className="bg-manso-cream/5 p-6 rounded-2xl border border-manso-cream/10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Images size={20} className="text-manso-terra" />
        <div>
          <h3 className="text-lg font-black uppercase tracking-tighter text-manso-cream">
            Galería de {artistaNombre}
          </h3>
          <p className="text-sm text-manso-cream/60 mt-0.5">
            {fotos.length} foto{fotos.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Uploader */}
      <div className="mb-6">
        <label className="text-[10px] font-black uppercase tracking-widest text-manso-cream/60 ml-1 mb-2 block">
          Agregar foto
        </label>
        <ImageUploader
          key={uploaderKey}
          bucket="artist"
          folder="gallery"
          maxWidth={1600}
          onUpload={handleUpload}
        />
      </div>

      {/* Grid de fotos */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="aspect-square bg-manso-cream/10 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : fotos.length === 0 ? (
        <div className="text-center py-8 text-manso-cream/40 text-sm">
          Aún no hay fotos en la galería
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {fotos.map((foto, index) => (
            <div
              key={foto.id}
              className="relative group aspect-square rounded-xl overflow-hidden bg-zinc-900"
            >
              <img
                src={foto.url}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Overlay con acciones */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <div className="flex gap-1">
                  <button
                    onClick={() => handleReorder(foto.id, Math.max(0, foto.orden - 1))}
                    disabled={actionLoading === foto.id || index === 0}
                    className="px-2 py-1 bg-white/20 text-white rounded text-xs disabled:opacity-30 hover:bg-white/30 transition-colors"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => handleReorder(foto.id, foto.orden + 1)}
                    disabled={actionLoading === foto.id || index === fotos.length - 1}
                    className="px-2 py-1 bg-white/20 text-white rounded text-xs disabled:opacity-30 hover:bg-white/30 transition-colors"
                  >
                    ▶
                  </button>
                </div>
                <button
                  onClick={() => handleDelete(foto)}
                  disabled={actionLoading === foto.id}
                  className="p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <span className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                #{index + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
