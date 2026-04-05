'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { ParticleBackground } from '@/components/Home/ParticleBackground';

interface AgendaItem {
  id: string;
  titulo: string;
  descripcion?: string;
  fecha?: string;
  categoria?: string;
  duracion?: string;
  frecuencia?: string;
  precio?: number;
  cupos_maximos?: number;
  luma_url?: string;
  whatsapp_contacto?: string;
  activo: boolean;
  orden: number;
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function AgendaPage() {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const mesActual = MESES[now.getMonth()];
  const anioActual = now.getFullYear();

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from('agenda')
          .select('*')
          .eq('activo', true)
          .order('created_at', { ascending: true });
        setItems(data || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Agrupar por categoría
  const grupos = items.reduce<Record<string, AgendaItem[]>>((acc, item) => {
    const cat = item.categoria || 'Eventos';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="relative min-h-screen bg-manso-black">
      <ParticleBackground />

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 pt-32 pb-24">

        {/* Header estilo programme */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-16">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.6em] text-manso-terra mb-3">
              Manso Club
            </p>
            <h1 className="text-[clamp(3rem,10vw,7rem)] font-black uppercase italic tracking-tighter leading-none text-manso-cream">
              Agenda
            </h1>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-manso-cream/30 mb-1">
              Programación
            </p>
            <p className="text-2xl md:text-4xl font-black uppercase tracking-tight text-manso-cream/60">
              {mesActual}
            </p>
            <p className="text-sm font-black text-manso-cream/30 tracking-widest">
              {anioActual}
            </p>
          </div>
        </div>

        {/* Línea divisora */}
        <div className="w-full h-px bg-manso-cream/10 mb-16" />

        {loading ? (
          <div className="flex items-center gap-3 text-manso-cream/30">
            <div className="w-4 h-4 border border-manso-cream/20 border-t-manso-cream/60 rounded-full animate-spin" />
            <span className="text-[10px] uppercase tracking-widest font-black">Cargando programa...</span>
          </div>

        ) : items.length === 0 ? (
          <div className="py-20">
            <div className="flex flex-col md:flex-row md:items-start gap-12">
              <span className="text-[12rem] font-black leading-none text-manso-cream/5 select-none hidden md:block">
                —
              </span>
              <div className="pt-2">
                <p className="text-[9px] font-black uppercase tracking-[0.6em] text-manso-terra mb-6">
                  Próxima temporada
                </p>
                <p className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-manso-cream/40 leading-tight mb-6">
                  Sin eventos<br />programados
                </p>
                <p className="text-sm text-manso-cream/25 font-light max-w-sm leading-relaxed">
                  La programación de {mesActual} se encuentra en preparación.
                  Seguí nuestras redes para enterarte de los próximos eventos.
                </p>
                <div className="mt-10 w-24 h-px bg-manso-terra/40" />
              </div>
            </div>
          </div>

        ) : (
          <div className="space-y-16">
            {Object.entries(grupos).map(([categoria, eventos], gi) => (
              <motion.div
                key={categoria}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Encabezado de categoría */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-[9px] font-black uppercase tracking-[0.6em] text-manso-terra">
                    {categoria}
                  </span>
                  <div className="flex-1 h-px bg-manso-cream/10" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/20">
                    {eventos.length} {eventos.length === 1 ? 'evento' : 'eventos'}
                  </span>
                </div>

                {/* Filas de eventos */}
                <div>
                  {eventos.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: gi * 0.1 + i * 0.06 }}
                      className="group border-b border-manso-cream/8 py-8 md:py-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-0 hover:bg-manso-cream/[0.03] transition-colors -mx-4 px-4 cursor-default"
                    >
                      {/* Número de orden */}
                      <div className="hidden md:block w-20 flex-shrink-0">
                        <span className="text-sm font-black text-manso-cream/15 tabular-nums">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Título + descripción */}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-manso-cream leading-tight">
                          {item.titulo}
                        </h2>
                        {item.descripcion && (
                          <p className="text-sm text-manso-cream/40 mt-2 font-light leading-relaxed max-w-xl">
                            {item.descripcion}
                          </p>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="flex flex-wrap md:flex-nowrap items-center gap-6 md:gap-10 flex-shrink-0">
                        {item.frecuencia && (
                          <div className="text-right">
                            <p className="text-[9px] uppercase tracking-widest text-manso-cream/25 font-black mb-0.5">Frecuencia</p>
                            <p className="text-sm font-black uppercase tracking-wide text-manso-cream/70">{item.frecuencia}</p>
                          </div>
                        )}
                        {item.duracion && (
                          <div className="text-right">
                            <p className="text-[9px] uppercase tracking-widest text-manso-cream/25 font-black mb-0.5">Duración</p>
                            <p className="text-sm font-black uppercase tracking-wide text-manso-cream/70">{item.duracion}</p>
                          </div>
                        )}
                        {item.cupos_maximos ? (
                          <div className="text-right">
                            <p className="text-[9px] uppercase tracking-widest text-manso-cream/25 font-black mb-0.5">Cupos</p>
                            <p className="text-sm font-black uppercase tracking-wide text-manso-cream/70">{item.cupos_maximos}</p>
                          </div>
                        ) : null}
                        <div className="text-right min-w-[70px]">
                          <p className="text-[9px] uppercase tracking-widest text-manso-cream/25 font-black mb-0.5">Precio</p>
                          <p className="text-base font-black text-manso-cream">
                            {!item.precio || item.precio === 0 ? 'Gratis' : `$${item.precio.toLocaleString('es-AR')}`}
                          </p>
                        </div>
                      </div>

                      {/* CTA Inscripción */}
                      <a
                        href={`/agenda/pagar?titulo=${encodeURIComponent(item.titulo)}&precio=${item.precio || 0}&frecuencia=${encodeURIComponent(item.frecuencia || '')}&categoria=${encodeURIComponent(item.categoria || '')}`}
                        className="flex-shrink-0 ml-0 md:ml-6 bg-manso-cream text-manso-black hover:bg-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
                      >
                        Inscribirme
                      </a>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer del programme */}
        <div className="mt-24 pt-8 border-t border-manso-cream/8 flex flex-col md:flex-row md:justify-between gap-2">
          <p className="text-[9px] uppercase tracking-[0.4em] text-manso-cream/20 font-black">
            Manso Club — Buenos Aires
          </p>
          <p className="text-[9px] uppercase tracking-[0.4em] text-manso-cream/20 font-black">
            Programación sujeta a cambios
          </p>
        </div>

      </div>
    </div>
  );
}
