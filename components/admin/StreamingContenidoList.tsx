'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Wifi, Pencil, Trash2, WifiOff } from 'lucide-react';

interface Item {
  id: string;
  titulo: string;
  slug: string;
  tipo: string;
  youtube_video_id: string | null;

  duracion_minutos: number | null;
  is_live: boolean;
  activo: boolean;
  orden: number;
}

const TIPO_COLOR: Record<string, string> = {
  concierto: 'bg-manso-blue text-manso-cream',
  curso:     'bg-manso-olive text-white',
  taller:    'bg-manso-brown text-manso-cream',
};

export function StreamingContenidoList({ refreshTrigger }: { refreshTrigger: number }) {
  const [items, setItems]     = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('streaming_contenido')
      .select('id, titulo, slug, tipo, youtube_video_id, duracion_minutos, is_live, activo, orden')
      .order('orden', { ascending: true });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [refreshTrigger]);

  const handleEdit = (item: Item) => {
    window.dispatchEvent(new CustomEvent('editStreamingContenido', { detail: item }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, titulo: string) => {
    if (!confirm(`¿Eliminar "${titulo}"? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from('streaming_contenido').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    fetch();
  };

  const toggleActivo = async (id: string, current: boolean) => {
    await supabase.from('streaming_contenido').update({ activo: !current }).eq('id', id);
    fetch();
  };

  const terminarStream = async (id: string, titulo: string) => {
    if (!confirm(`¿Terminar el stream "${titulo}"?\n\nEl badge "En vivo" se apagará y el video quedará disponible como grabación en Multimedia.`)) return;
    const { error } = await supabase
      .from('streaming_contenido')
      .update({ is_live: false, activo: true, fue_transmitido: true, transmitido_en: new Date().toISOString() })
      .eq('id', id);
    if (error) { alert(error.message); return; }
    fetch();
  };

  if (loading) {
    return (
      <div className="bg-manso-cream/5 rounded-[2.5rem] border border-manso-cream/10 p-8 text-center">
        <p className="text-manso-cream/40 text-sm uppercase tracking-widest font-black">Cargando...</p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="bg-manso-cream/5 rounded-[2.5rem] border border-manso-cream/10 p-10 text-center">
        <p className="text-manso-cream/30 text-sm uppercase tracking-widest font-black">Sin contenido aún</p>
        <p className="text-manso-cream/20 text-xs mt-2">Creá el primer video desde el formulario</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div
          key={item.id}
          className={`bg-manso-cream/5 rounded-2xl border p-4 transition-all ${
            item.activo ? 'border-manso-cream/10' : 'border-manso-cream/5 opacity-50'
          }`}
        >
          {/* Botón terminar stream — solo visible cuando está en vivo */}
          {item.is_live && (
            <button
              onClick={() => terminarStream(item.id, item.titulo)}
              className="w-full mb-3 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-600/20 border border-red-600/40 text-red-400 hover:bg-red-600/30 hover:text-red-300 transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <WifiOff size={12} />
              Terminar stream
            </button>
          )}

          <div className="flex items-start justify-between gap-3">
            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${TIPO_COLOR[item.tipo] ?? 'bg-zinc-700 text-white'}`}>
                  {item.tipo}
                </span>
                {item.is_live && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-[8px] font-black uppercase tracking-widest">
                    <Wifi size={7} />
                    Live
                  </span>
                )}
                {!item.activo && (
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-manso-cream/10 text-manso-cream/40">
                    Oculto
                  </span>
                )}
              </div>

              <p className="text-manso-cream font-black text-sm leading-tight truncate">{item.titulo}</p>

              <div className="flex items-center gap-3 mt-1">
                <span className="text-manso-cream/30 text-[10px] font-mono">/{item.slug}</span>
                {item.youtube_video_id && (
                  <span className="text-manso-cream/30 text-[10px] font-mono">YT: {item.youtube_video_id}</span>
                )}
                {item.duracion_minutos && (
                  <span className="text-manso-cream/30 text-[10px]">{item.duracion_minutos} min</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleActivo(item.id, item.activo)}
                className={`w-8 h-8 rounded-full text-xs font-black transition-all flex items-center justify-center ${
                  item.activo
                    ? 'bg-manso-olive/20 text-manso-olive hover:bg-manso-olive/30'
                    : 'bg-manso-cream/10 text-manso-cream/30 hover:bg-manso-cream/20'
                }`}
                title={item.activo ? 'Ocultar' : 'Activar'}
              >
                {item.activo ? '●' : '○'}
              </button>
              <button
                onClick={() => handleEdit(item)}
                className="w-8 h-8 rounded-full bg-manso-cream/10 text-manso-cream/60 hover:bg-manso-cream/20 hover:text-manso-cream transition-all flex items-center justify-center"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => handleDelete(item.id, item.titulo)}
                className="w-8 h-8 rounded-full bg-manso-terra/10 text-manso-terra/60 hover:bg-manso-terra/20 hover:text-manso-terra transition-all flex items-center justify-center"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
