'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Edit, Trash2, Users, Eye } from 'lucide-react';

interface AgendaEvent {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  duracion: string;
  frecuencia: string;
  precio: number;
  activo: boolean;
  cupos_maximos?: number;
  whatsapp_contacto?: string;
  created_at: string;
}

interface Inscripcion {
  id: string;
  agenda_event_id: string;
  nombre: string;
  email: string;
  telefono: string;
  mensaje?: string;
  created_at: string;
}

export function AgendaList() {
  const [eventos, setEventos] = useState<AgendaEvent[]>([]);
  const [inscripciones, setInscripciones] = useState<Record<string, Inscripcion[]>>({});
  const [loading, setLoading] = useState(true);
  const [showInscripciones, setShowInscripciones] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    const { data, error } = await supabase
      .from('agenda')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching eventos:', error);
    } else {
      setEventos(data || []);
      // Cargar inscripciones para cada evento
      data?.forEach(evento => {
        fetchInscripciones(evento.id);
      });
    }
    setLoading(false);
  };

  const fetchInscripciones = async (agendaEventId: string) => {
    const { data, error } = await supabase
      .from('agenda_inscripciones')
      .select('*')
      .eq('agenda_event_id', agendaEventId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setInscripciones(prev => ({
        ...prev,
        [agendaEventId]: data
      }));
    }
  };

  const handleEdit = (evento: AgendaEvent) => {
    window.dispatchEvent(new CustomEvent('editAgendaEvent', { detail: evento }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este evento de la agenda?')) return;

    const { error } = await supabase
      .from('agenda')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error al eliminar evento: ' + error.message);
    } else {
      alert('Evento eliminado correctamente');
      window.location.reload();
    }
  };

  const toggleInscripciones = (eventoId: string) => {
    setShowInscripciones(prev => ({
      ...prev,
      [eventoId]: !prev[eventoId]
    }));
  };

  const toggleActivo = async (evento: AgendaEvent) => {
    const { error } = await supabase
      .from('agenda')
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
        Cargando eventos de agenda...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {eventos.length === 0 ? (
        <div className="text-center text-manso-cream/40 py-8">
          No hay eventos en la agenda
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
                </div>
                
                <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-widest text-manso-cream/60 mb-3">
                  <span>{evento.categoria}</span>
                  <span>•</span>
                  <span>{evento.frecuencia}</span>
                  <span>•</span>
                  <span>{evento.duracion}</span>
                  <span>•</span>
                  <span className={evento.precio > 0 ? 'text-manso-terra' : 'text-green-400'}>
                    {evento.precio > 0 ? `$${evento.precio}` : 'Gratis'}
                  </span>
                </div>

                <p className="text-sm text-manso-cream/80 mb-3 line-clamp-2">
                  {evento.descripcion}
                </p>

                <div className="flex items-center gap-4 text-[10px] text-manso-cream/60">
                  {evento.cupos_maximos && evento.cupos_maximos > 0 && (
                    <span>Cupos: {evento.cupos_maximos}</span>
                  )}
                  {evento.whatsapp_contacto && (
                    <span>WhatsApp: {evento.whatsapp_contacto}</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => toggleInscripciones(evento.id)}
                  className="p-2 bg-manso-cream/10 text-manso-cream/60 hover:text-manso-terra rounded-xl transition-colors"
                  title="Ver inscripciones"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => handleEdit(evento)}
                  className="p-2 bg-manso-cream/10 text-manso-cream/60 hover:text-manso-terra rounded-xl transition-colors"
                  title="Editar evento"
                >
                  <Edit size={16} />
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

            {/* Sección de inscripciones */}
            {showInscripciones[evento.id] && (
              <div className="mt-4 pt-4 border-t border-manso-cream/10">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={16} className="text-manso-terra" />
                  <h4 className="text-sm font-bold uppercase tracking-wider text-manso-cream">
                    Inscripciones ({inscripciones[evento.id]?.length || 0})
                  </h4>
                </div>
                
                {inscripciones[evento.id]?.length === 0 ? (
                  <p className="text-manso-cream/40 text-sm">No hay inscripciones aún</p>
                ) : (
                  <div className="space-y-2">
                    {inscripciones[evento.id]?.map((inscripcion) => (
                      <div key={inscripcion.id} className="bg-manso-cream/5 p-3 rounded-xl">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-sm font-bold text-manso-cream">
                                {inscripcion.nombre}
                              </span>
                              <span className="text-[10px] text-manso-terra font-mono">
                                ID: {inscripcion.id.slice(0, 8)}
                              </span>
                            </div>
                            <div className="text-[10px] text-manso-cream/60 space-y-1">
                              <div>Email: {inscripcion.email}</div>
                              <div>Teléfono: {inscripcion.telefono}</div>
                              {inscripcion.mensaje && (
                                <div>Mensaje: {inscripcion.mensaje}</div>
                              )}
                              <div>Fecha: {new Date(inscripcion.created_at).toLocaleDateString('es-AR')}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
