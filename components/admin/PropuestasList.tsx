'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, CheckCircle, Clock, Mail, Link as LinkIcon } from 'lucide-react';

interface Propuesta {
  id: string;
  nombre: string;
  email: string;
  tipo: string;
  descripcion: string;
  links?: string;
  revisado: boolean;
  created_at: string;
}

const TIPO_LABEL: Record<string, string> = {
  artista:    'Artista',
  taller:     'Taller',
  residencia: 'Residencia',
  otro:       'Otro',
};

export function PropuestasList({ refreshTrigger }: { refreshTrigger?: number }) {
  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { fetchPropuestas(); }, [refreshTrigger]);

  const fetchPropuestas = async () => {
    const { data } = await supabase
      .from('propuestas')
      .select('*')
      .order('created_at', { ascending: false });
    setPropuestas(data || []);
    setLoading(false);
  };

  const toggleRevisado = async (id: string, revisado: boolean) => {
    await supabase.from('propuestas').update({ revisado: !revisado }).eq('id', id);
    setPropuestas(prev => prev.map(p => p.id === id ? { ...p, revisado: !revisado } : p));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta propuesta?')) return;
    await supabase.from('propuestas').delete().eq('id', id);
    setPropuestas(prev => prev.filter(p => p.id !== id));
  };

  if (loading) return <div className="text-manso-cream/60 text-center py-8">Cargando propuestas...</div>;

  const pendientes = propuestas.filter(p => !p.revisado);
  const revisadas  = propuestas.filter(p =>  p.revisado);

  return (
    <div className="space-y-4">
      <h3 className="text-base font-black uppercase tracking-tighter text-manso-cream mb-4">
        Propuestas ({propuestas.length})
        {pendientes.length > 0 && (
          <span className="ml-3 text-[9px] bg-manso-terra text-manso-cream px-2 py-0.5 rounded-full">
            {pendientes.length} nuevas
          </span>
        )}
      </h3>

      {propuestas.length === 0 ? (
        <div className="text-manso-cream/40 text-sm text-center py-8">No hay propuestas todavía</div>
      ) : [...pendientes, ...revisadas].map(p => (
        <div key={p.id} className={`rounded-2xl border transition-all ${
          p.revisado ? 'bg-manso-black/20 border-manso-cream/10 opacity-70' : 'bg-manso-cream/10 border-manso-cream/20'
        }`}>
          {/* Header */}
          <div
            className="flex items-center justify-between gap-4 p-4 cursor-pointer"
            onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-manso-cream font-bold text-sm">{p.nombre}</span>
                <span className="text-[9px] uppercase tracking-widest text-manso-terra border border-manso-terra/30 px-2 py-0.5 rounded">
                  {TIPO_LABEL[p.tipo] || p.tipo}
                </span>
                {!p.revisado && (
                  <span className="text-[9px] uppercase tracking-widest text-manso-cream/60 flex items-center gap-1">
                    <Clock size={10} /> Nueva
                  </span>
                )}
              </div>
              <p className="text-manso-cream/40 text-xs mt-0.5">
                {new Date(p.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={e => { e.stopPropagation(); toggleRevisado(p.id, p.revisado); }}
                className={`p-2 rounded-lg transition-all ${p.revisado ? 'bg-green-500/20 ring-2 ring-green-500/30' : 'bg-manso-cream/10 ring-2 ring-manso-cream/20'}`}
                title={p.revisado ? 'Marcar como pendiente' : 'Marcar como revisada'}
              >
                <CheckCircle size={14} className={p.revisado ? 'text-green-400' : 'text-manso-cream/40'} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); handleDelete(p.id); }}
                className="p-2 rounded-lg bg-red-500/20 ring-2 ring-red-500/30 transition-all"
              >
                <Trash2 size={14} className="text-red-400" />
              </button>
            </div>
          </div>

          {/* Detalle expandible */}
          {expandedId === p.id && (
            <div className="px-4 pb-4 space-y-3 border-t border-manso-cream/10 pt-4">
              <div className="flex items-center gap-2 text-manso-cream/60 text-xs">
                <Mail size={12} />
                <a href={`mailto:${p.email}`} className="hover:text-manso-terra transition-colors">{p.email}</a>
              </div>
              <p className="text-manso-cream/80 text-sm leading-relaxed">{p.descripcion}</p>
              {p.links && (
                <div className="flex items-center gap-2 text-manso-cream/50 text-xs">
                  <LinkIcon size={12} />
                  <span>{p.links}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
