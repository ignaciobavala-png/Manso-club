'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit, Trash2, ExternalLink, Calendar, Tag } from 'lucide-react';

interface Evento {
  id: string;
  titulo: string;
  fecha: string;
  descripcion?: string;
  imagen_url?: string;
  categoria?: string;
  link_tickets?: string;
  disponible: boolean;
  activo: boolean;
  orden: number;
  created_at: string;
}

export function EventosList() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .order('orden', { ascending: true })
      .order('fecha', { ascending: true });

    if (!error) {
      setEventos(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (evento: Evento) => {
    window.dispatchEvent(new CustomEvent('editEvento', { detail: evento }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) return;

    const { error } = await supabase
      .from('eventos')
      .update({ activo: false })
      .eq('id', id);

    if (error) {
      alert('Error al eliminar evento: ' + error.message);
    } else {
      alert('Evento eliminado correctamente');
      fetchEventos();
    }
  };

  const toggleDisponible = async (evento: Evento) => {
    const { error } = await supabase
      .from('eventos')
      .update({ disponible: !evento.disponible })
      .eq('id', evento.id);

    if (error) {
      alert('Error al actualizar disponibilidad: ' + error.message);
    } else {
      setEventos(prev => 
        prev.map(e => e.id === evento.id ? { ...e, disponible: !e.disponible } : e)
      );
    }
  };

  const toggleActivo = async (evento: Evento) => {
    const { error } = await supabase
      .from('eventos')
      .update({ activo: !evento.activo })
      .eq('id', evento.id);

    if (error) {
      alert('Error al actualizar estado: ' + error.message);
    } else {
      setEventos(prev => 
        prev.map(e => e.id === evento.id ? { ...e, activo: !e.activo } : e)
      );
    }
  };

  if (loading) {
    return (
      <div className="text-center text-manso-cream/60 py-8">
        Cargando eventos...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {eventos.length === 0 ? (
        <div className="text-center text-manso-cream/40 py-8">
          No hay eventos registrados
        </div>
      ) : (
        eventos.map((evento) => (
          <div key={evento.id} className="bg-manso-cream/5 p-6 rounded-2xl border border-manso-cream/10">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-black text-manso-cream uppercase tracking-tighter">
                    {evento.titulo}
                  </h3>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                    evento.activo 
                      ? 'bg-manso-terra/20 text-manso-terra' 
                      : 'bg-manso-cream/20 text-manso-cream/60'
                  }`}>
                    {evento.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                    evento.disponible 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {evento.disponible ? 'Disponible' : 'No disponible'}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-widest text-manso-cream/60 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(evento.fecha).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                  {evento.categoria && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Tag size={12} />
                        {evento.categoria}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span>Orden: {evento.orden}</span>
                </div>

                {evento.descripcion && (
                  <p className="text-sm text-manso-cream/80 mb-3 line-clamp-2">
                    {evento.descripcion}
                  </p>
                )}

                {evento.imagen_url && (
                  <div className="mb-3">
                    <img 
                      src={evento.imagen_url} 
                      alt={evento.titulo}
                      className="w-24 h-24 object-cover rounded-xl border border-manso-cream/20"
                    />
                  </div>
                )}

                <div className="flex items-center gap-4 text-[10px] text-manso-cream/60">
                  {evento.link_tickets && (
                    <a 
                      href={evento.link_tickets}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-manso-terra hover:text-manso-cream transition-colors"
                    >
                      <ExternalLink size={12} />
                      Tickets
                    </a>
                  )}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(evento)}
                  className="p-2 bg-manso-cream/10 text-manso-cream/60 hover:text-manso-terra rounded-xl transition-colors"
                  title="Editar evento"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => toggleDisponible(evento)}
                  className="p-2 bg-manso-cream/10 text-manso-cream/60 hover:text-manso-terra rounded-xl transition-colors"
                  title={evento.disponible ? 'Marcar como no disponible' : 'Marcar como disponible'}
                >
                  {evento.disponible ? '🟢' : '🟡'}
                </button>
                <button
                  onClick={() => toggleActivo(evento)}
                  className="p-2 bg-manso-cream/10 text-manso-cream/60 hover:text-manso-terra rounded-xl transition-colors"
                  title={evento.activo ? 'Desactivar' : 'Activar'}
                >
                  {evento.activo ? '🔴' : '🟢'}
                </button>
                <button
                  onClick={() => handleDelete(evento.id)}
                  className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl transition-colors"
                  title="Eliminar evento"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
