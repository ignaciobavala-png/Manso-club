'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart2, Eye, MessageSquare } from 'lucide-react';

interface ThreadActividad {
  id: string;
  titulo: string;
  autor_nombre: string | null;
  views: number;
  reply_count: number;
  created_at: string;
}

type Orden = 'views' | 'reply_count' | 'created_at';

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' });
}

export function ActividadForo() {
  const [threads, setThreads] = useState<ThreadActividad[]>([]);
  const [orden, setOrden] = useState<Orden>('views');
  const [loading, setLoading] = useState(true);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('foro_threads')
      .select('id, titulo, autor_nombre, views, reply_count, created_at')
      .order(orden, { ascending: false })
      .limit(100);
    setThreads(data ?? []);
    setLoading(false);
  }, [orden]);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  const totalViews = threads.reduce((acc, t) => acc + (t.views ?? 0), 0);
  const totalReplies = threads.reduce((acc, t) => acc + (t.reply_count ?? 0), 0);

  const ordenes: { id: Orden; label: string }[] = [
    { id: 'views', label: 'Vistas' },
    { id: 'reply_count', label: 'Respuestas' },
    { id: 'created_at', label: 'Recientes' },
  ];

  return (
    <div className="bg-manso-cream/5 rounded-[2.5rem] border border-manso-cream/10 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-black uppercase tracking-tighter text-manso-cream flex items-center gap-2">
          <BarChart2 size={18} className="text-manso-terra" />
          Actividad del foro
        </h3>
        <div className="flex gap-1 bg-manso-cream/5 p-1 rounded-xl">
          {ordenes.map(o => (
            <button
              key={o.id}
              onClick={() => setOrden(o.id)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                orden === o.id ? 'bg-manso-cream text-manso-black' : 'text-manso-cream/50 hover:text-manso-cream'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Totales */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 bg-manso-cream/5 rounded-2xl px-4 py-3 border border-manso-cream/10">
          <Eye size={14} className="text-manso-terra" />
          <span className="text-manso-cream text-sm font-black">{totalViews.toLocaleString('es-AR')}</span>
          <span className="text-manso-cream/40 text-[10px] uppercase tracking-widest font-black">vistas</span>
        </div>
        <div className="flex items-center gap-2 bg-manso-cream/5 rounded-2xl px-4 py-3 border border-manso-cream/10">
          <MessageSquare size={14} className="text-manso-terra" />
          <span className="text-manso-cream text-sm font-black">{totalReplies.toLocaleString('es-AR')}</span>
          <span className="text-manso-cream/40 text-[10px] uppercase tracking-widest font-black">respuestas</span>
        </div>
      </div>

      {loading ? (
        <p className="text-manso-cream/40 text-xs text-center py-12">Cargando actividad...</p>
      ) : threads.length === 0 ? (
        <p className="text-manso-cream/30 text-xs text-center py-8 uppercase tracking-widest font-black">
          Sin publicaciones todavía
        </p>
      ) : (
        <div className="space-y-2">
          {threads.map(t => (
            <a
              key={t.id}
              href={`/foro/${t.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-3 bg-manso-cream/5 rounded-2xl px-4 py-3 border border-manso-cream/10 hover:border-manso-terra/40 transition-all"
            >
              <div className="min-w-0">
                <p className="text-manso-cream text-xs font-bold truncate">{t.titulo}</p>
                <p className="text-manso-cream/40 text-[11px] mt-0.5">
                  {t.autor_nombre ?? 'Anónimo'} · {formatFecha(t.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0 text-manso-cream/60">
                <span className="flex items-center gap-1.5 text-xs font-black">
                  <Eye size={13} className="text-manso-terra" />
                  {t.views ?? 0}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-black">
                  <MessageSquare size={13} className="text-manso-cream/40" />
                  {t.reply_count ?? 0}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
