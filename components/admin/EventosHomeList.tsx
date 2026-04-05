'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';

interface EventoHome {
  id: string;
  fecha: string;
  titulo: string;
  categoria: string;
  disponible: boolean;
  orden: number;
  activo: boolean;
}

interface EventosHomeListProps {
  refreshTrigger?: number;
}

export function EventosHomeList({ refreshTrigger }: EventosHomeListProps) {
  const [eventos, setEventos] = useState<EventoHome[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventos();
  }, [refreshTrigger]);

  const fetchEventos = async () => {
    const { data, error } = await supabase
      .from('eventos_home')
      .select('*')
      .order('orden', { ascending: true });

    if (!error) {
      setEventos(data || []);
    }
    setLoading(false);
  };

  const toggleActivo = async (id: string, activo: boolean) => {
    const { error } = await supabase
      .from('eventos_home')
      .update({ activo: !activo })
      .eq('id', id);

    if (error) {
      alert('Error al actualizar estado: ' + error.message);
    } else {
      fetchEventos();
    }
  };

  const toggleDisponible = async (id: string, disponible: boolean) => {
    const { error } = await supabase
      .from('eventos_home')
      .update({ disponible: !disponible })
      .eq('id', id);

    if (error) {
      alert('Error al actualizar disponibilidad: ' + error.message);
    } else {
      fetchEventos();
    }
  };

  const deleteEvento = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este evento?')) return;

    const { error } = await supabase
      .from('eventos_home')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error al eliminar evento: ' + error.message);
    } else {
      fetchEventos();
    }
  };

  if (loading) {
    return <div className="text-manso-cream/60">Cargando eventos...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-black uppercase tracking-tighter text-manso-cream mb-6">
        Eventos del Home
      </h3>
      
      {eventos.length === 0 ? (
        <div className="text-manso-cream/40 text-center py-8">
          No hay eventos configurados
        </div>
      ) : (
        eventos.map((evento, index) => (
          <div 
            key={evento.id} 
            className={`p-4 rounded-2xl border transition-all ${
              evento.activo 
                ? 'bg-manso-cream/10 border-manso-cream/20' 
                : 'bg-manso-black/20 border-manso-cream/10 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className={`flex items-center gap-3 mb-2 ${
                  !evento.activo ? 'opacity-60' : ''
                }`}>
                  <span className={`text-xs font-black text-manso-terra uppercase tracking-wider ${
                    !evento.activo ? 'line-through decoration-1 decoration-manso-terra/50' : ''
                  }`}>
                    {evento.fecha}
                  </span>
                  <span className={`text-[9px] uppercase tracking-widest text-manso-cream/60 px-2 py-1 border border-manso-cream/20 rounded ${
                    !evento.activo ? 'line-through decoration-1 decoration-manso-cream/30' : ''
                  }`}>
                    {evento.categoria}
                  </span>
                  {!evento.disponible && (
                    <span className="text-[9px] uppercase font-bold text-manso-cream/60 border border-manso-cream/20 px-2 py-1">
                      Sold Out
                    </span>
                  )}
                </div>
                <h4 className={`text-xl font-bold uppercase tracking-tighter text-manso-cream ${
                  !evento.activo ? 'line-through decoration-1 decoration-manso-cream/50' : ''
                }`}>
                  {evento.titulo}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                {/* Editar */}
                <button
                  onClick={() => {
                    // Aquí pasaremos el evento al formulario de edición
                    const editEvent = new CustomEvent('editEventoHome', { detail: evento });
                    window.dispatchEvent(editEvent);
                  }}
                  className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 ring-2 ring-blue-500/30 transition-all"
                  title="Editar datos del evento"
                >
                  <Edit2 size={14} className="text-blue-400" />
                </button>

                {/* Toggle activo */}
                <button
                  onClick={() => toggleActivo(evento.id, evento.activo)}
                  className={`p-2 rounded-lg transition-all ${
                    evento.activo 
                      ? 'bg-green-500/20 hover:bg-green-500/30 ring-2 ring-green-500/30' 
                      : 'bg-red-500/20 hover:bg-red-500/30 ring-2 ring-red-500/30'
                  }`}
                  title={evento.activo ? 'Evento visible - Click para ocultar' : 'Evento oculto - Click para mostrar'}
                >
                  {evento.activo ? (
                    <Eye size={14} className="text-green-400" />
                  ) : (
                    <EyeOff size={14} className="text-red-400" />
                  )}
                </button>

                {/* Toggle disponible */}
                <button
                  onClick={() => toggleDisponible(evento.id, evento.disponible)}
                  className={`p-2 rounded-lg transition-all ${
                    evento.disponible 
                      ? 'bg-green-500/20 hover:bg-green-500/30 ring-2 ring-green-500/30' 
                      : 'bg-red-500/20 hover:bg-red-500/30 ring-2 ring-red-500/30'
                  }`}
                  title={evento.disponible ? 'Disponible para venta - Click para marcar como sold out' : 'Sold out - Click para habilitar venta'}
                >
                  <Calendar size={14} className={evento.disponible ? 'text-green-400' : 'text-red-400'} />
                </button>

                {/* Eliminar */}
                <button
                  onClick={() => deleteEvento(evento.id)}
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 ring-2 ring-red-500/30 transition-all"
                  title="Eliminar evento permanentemente"
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
