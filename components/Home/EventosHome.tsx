'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface EventoHome {
  id: string;
  titulo: string;
  categoria: string;
  disponible: boolean;
  orden: number;
  activo: boolean;
  link_tickets?: string;
}

interface EventoFecha {
  id: string;
  fecha: string;
  titulo: string;
  categoria: string;
  disponible: boolean;
  activo: boolean;
  imagen_url?: string;
  link_tickets?: string;
}

export const EventosHome = () => {
  const [eventosRecurrentes, setEventosRecurrentes] = useState<EventoHome[]>([]);
  const [eventosFecha, setEventosFecha] = useState<EventoFecha[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    try {
      // Obtener eventos recurrentes de eventos_home
      const { data: eventosHome, error: errorHome } = await supabase
        .from('eventos_home')
        .select('*')
        .eq('activo', true)
        .order('orden', { ascending: true });

      // Obtener eventos con fecha específica de eventos (limitado a 2)
      const { data: eventosConFecha, error: errorFecha } = await supabase
        .from('eventos')
        .select('*')
        .eq('activo', true)
        .order('fecha', { ascending: true })
        .limit(2);

      if (errorHome || errorFecha) {
        throw new Error('Error fetching eventos');
      }

      setEventosRecurrentes(eventosHome || []);
      setEventosFecha(eventosConFecha || []);
    } catch (error) {
      // Si hay error, mostrar arrays vacíos
      setEventosRecurrentes([]);
      setEventosFecha([]);
    }
    setLoading(false);
  };

  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    const dias = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SAB'];
    const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    
    return `${dias[fecha.getDay()]} ${fecha.getDate()} ${meses[fecha.getMonth()]}`;
  };

  if (loading) {
    return (
      <section className="py-20 px-8 md:px-20" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-black/60 py-8">
            Cargando eventos...
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-8 md:px-20" style={{ backgroundColor: '#F5F0E8' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-5xl font-medium leading-tight uppercase tracking-tighter italic text-black">
            Eventos
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative">
          {/* COLUMNA IZQUIERDA: AGENDA RECURRENTE */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600 mb-6">
              AGENDA
            </h3>
            
            <div className="space-y-1">
              {eventosRecurrentes.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No hay eventos disponibles
                </div>
              ) : (
                eventosRecurrentes.map((evento, index) => (
                  <div key={evento.id}>
                    <div className="flex items-center justify-between py-4 group">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-black leading-none mb-1">
                          {evento.titulo}
                        </h4>
                        <span className="text-[9px] uppercase tracking-widest text-gray-500">
                          {evento.categoria}
                        </span>
                      </div>
                      
                      <div className="ml-4">
                        {!evento.disponible ? (
                          <span className="text-[10px] uppercase font-bold text-gray-600 bg-gray-200 px-3 py-1">
                            SOLD OUT
                          </span>
                        ) : (
                          <button 
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-black text-white px-3 py-1 hover:bg-gray-800 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (evento.link_tickets) {
                                window.open(evento.link_tickets, '_blank');
                              }
                            }}
                          >
                            TICKETS <ArrowRight size={12} className="shrink-0" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Separador fino entre eventos (no después del último) */}
                    {index < eventosRecurrentes.length - 1 && (
                      <div className="border-b border-gray-300" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Separador vertical en desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 transform -translate-x-1/2" />

          {/* COLUMNA DERECHA: PRÓXIMOS EVENTOS (FLYERS) */}
          {eventosFecha.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600 mb-6">
                PRÓXIMOS EVENTOS
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {eventosFecha.map((evento) => (
                  <div key={evento.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {/* Flyer del evento */}
                    <div className="relative w-full h-48 bg-gray-900">
                      {evento.imagen_url ? (
                        <Image
                          src={evento.imagen_url}
                          alt={evento.titulo}
                          fill
                          className="object-contain"
                        />
                      ) : (
                        // Placeholder oscuro para eventos sin imagen
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          <h4 className="text-white font-bold text-center px-4">
                            {evento.titulo}
                          </h4>
                        </div>
                      )}
                    </div>
                    
                    {/* Info del evento */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-black leading-none mb-1">
                            {evento.titulo}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{formatearFecha(evento.fecha)}</span>
                            <span>•</span>
                            <span className="text-[9px] uppercase tracking-widest">{evento.categoria}</span>
                          </div>
                        </div>
                      </div>
                      
                      {evento.disponible && evento.link_tickets && (
                        <button 
                          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-black text-white px-3 py-1 hover:bg-gray-800 transition-colors mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (evento.link_tickets) {
                              window.open(evento.link_tickets, '_blank');
                            }
                          }}
                        >
                          TICKETS <ArrowRight size={12} className="shrink-0" />
                        </button>
                      )}
                      
                      {!evento.disponible && (
                        <span className="text-[10px] uppercase font-bold text-gray-600 bg-gray-200 px-3 py-1 mt-2 inline-block">
                          SOLD OUT
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
