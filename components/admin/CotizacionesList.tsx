'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, ChevronDown, ChevronUp, Mail, Phone, Calendar } from 'lucide-react';

interface Cotizacion {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  tipo_evento_label: string;
  duracion_label: string;
  capacidad_label: string;
  servicios_labels: string[];
  fecha: string | null;
  hora: string | null;
  precio_estimado: number;
  estado: 'nueva' | 'en_proceso' | 'respondida' | 'archivada';
  notas_admin: string | null;
  created_at: string;
}

const ESTADO_CONFIG: Record<Cotizacion['estado'], { label: string; color: string }> = {
  nueva:      { label: 'Nueva',       color: 'bg-manso-terra text-manso-cream' },
  en_proceso: { label: 'En proceso',  color: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' },
  respondida: { label: 'Respondida',  color: 'bg-green-500/20 text-green-300 border border-green-500/30' },
  archivada:  { label: 'Archivada',   color: 'bg-manso-cream/10 text-manso-cream/40' },
};

export function CotizacionesList({ refreshTrigger }: { refreshTrigger?: number }) {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notasEdit, setNotasEdit] = useState<Record<string, string>>({});

  useEffect(() => { fetchCotizaciones(); }, [refreshTrigger]);

  const fetchCotizaciones = async () => {
    const { data } = await supabase
      .from('cotizaciones')
      .select('*')
      .order('created_at', { ascending: false });
    setCotizaciones(data || []);
    setLoading(false);
  };

  const updateEstado = async (id: string, estado: Cotizacion['estado']) => {
    await supabase.from('cotizaciones').update({ estado }).eq('id', id);
    setCotizaciones(prev => prev.map(c => c.id === id ? { ...c, estado } : c));
  };

  const saveNotas = async (id: string) => {
    const notas = notasEdit[id] ?? '';
    await supabase.from('cotizaciones').update({ notas_admin: notas }).eq('id', id);
    setCotizaciones(prev => prev.map(c => c.id === id ? { ...c, notas_admin: notas } : c));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta cotización?')) return;
    await supabase.from('cotizaciones').delete().eq('id', id);
    setCotizaciones(prev => prev.filter(c => c.id !== id));
  };

  if (loading) return <div className="text-manso-cream/40 text-center py-8">Cargando...</div>;

  const nuevas = cotizaciones.filter(c => c.estado === 'nueva');

  return (
    <div className="space-y-4">
      <h3 className="text-base font-black uppercase tracking-tighter text-manso-cream mb-4">
        Solicitudes de cotización ({cotizaciones.length})
        {nuevas.length > 0 && (
          <span className="ml-3 text-[9px] bg-manso-terra text-manso-cream px-2 py-0.5 rounded-full">
            {nuevas.length} nuevas
          </span>
        )}
      </h3>

      {cotizaciones.length === 0 ? (
        <div className="text-manso-cream/40 text-sm text-center py-8">
          Todavía no hay solicitudes
        </div>
      ) : cotizaciones.map(c => (
        <div
          key={c.id}
          className={`rounded-2xl border transition-all ${
            c.estado === 'archivada'
              ? 'bg-manso-black/20 border-manso-cream/10 opacity-60'
              : 'bg-manso-cream/5 border-manso-cream/15'
          }`}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between gap-4 p-4 cursor-pointer"
            onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-manso-cream font-bold text-sm">{c.nombre}</span>
                <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded font-black ${ESTADO_CONFIG[c.estado].color}`}>
                  {ESTADO_CONFIG[c.estado].label}
                </span>
                {c.tipo_evento_label && (
                  <span className="text-[9px] uppercase tracking-widest text-manso-cream/50 border border-manso-cream/20 px-2 py-0.5 rounded">
                    {c.tipo_evento_label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-manso-cream/40 text-xs">
                <span>{new Date(c.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                <span className="text-manso-terra font-black">${c.precio_estimado.toLocaleString('es-AR')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={e => { e.stopPropagation(); handleDelete(c.id); }}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all"
              >
                <Trash2 size={13} className="text-red-400" />
              </button>
              {expandedId === c.id
                ? <ChevronUp size={16} className="text-manso-cream/40" />
                : <ChevronDown size={16} className="text-manso-cream/40" />
              }
            </div>
          </div>

          {/* Detalle expandible */}
          {expandedId === c.id && (
            <div className="px-4 pb-5 space-y-4 border-t border-manso-cream/10 pt-4">
              {/* Contacto */}
              <div className="flex flex-wrap gap-4 text-xs text-manso-cream/60">
                <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 hover:text-manso-terra transition-colors">
                  <Mail size={12} /> {c.email}
                </a>
                <a href={`tel:${c.telefono}`} className="flex items-center gap-1.5 hover:text-manso-terra transition-colors">
                  <Phone size={12} /> {c.telefono}
                </a>
                {c.fecha && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    {new Date(c.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    {c.hora && ` a las ${c.hora}`}
                  </span>
                )}
              </div>

              {/* Detalles del evento */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Tipo',      value: c.tipo_evento_label },
                  { label: 'Duración',  value: c.duracion_label },
                  { label: 'Capacidad', value: c.capacidad_label },
                  { label: 'Servicios', value: c.servicios_labels?.join(', ') || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-manso-cream/5 rounded-xl p-3">
                    <p className="text-[9px] uppercase tracking-widest text-manso-terra mb-1">{label}</p>
                    <p className="text-manso-cream/80 text-xs">{value || '—'}</p>
                  </div>
                ))}
              </div>

              {/* Estado */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-manso-terra mb-2">Estado</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(ESTADO_CONFIG) as Cotizacion['estado'][]).map(est => (
                    <button
                      key={est}
                      onClick={() => updateEstado(c.id, est)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        c.estado === est
                          ? ESTADO_CONFIG[est].color + ' ring-2 ring-offset-1 ring-offset-manso-black ring-manso-terra/50'
                          : 'bg-manso-cream/5 text-manso-cream/40 hover:bg-manso-cream/10'
                      }`}
                    >
                      {ESTADO_CONFIG[est].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas admin */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-manso-terra mb-2">Notas internas</p>
                <textarea
                  rows={2}
                  className="w-full bg-manso-cream/5 border border-manso-cream/15 rounded-xl px-4 py-3 text-manso-cream/80 placeholder:text-manso-cream/20 text-sm font-light focus:outline-none focus:border-manso-terra/50 transition-colors resize-none"
                  placeholder="Agregar nota..."
                  defaultValue={c.notas_admin || ''}
                  onChange={e => setNotasEdit(prev => ({ ...prev, [c.id]: e.target.value }))}
                />
                <button
                  onClick={() => saveNotas(c.id)}
                  className="mt-2 px-4 py-1.5 bg-manso-cream/10 hover:bg-manso-cream/20 text-manso-cream/70 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
                >
                  Guardar nota
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
