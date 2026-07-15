'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { WHATSAPP_NUMBER } from '@/lib/constants';
import { TYPE } from '@/lib/ui-constants';
import Image from 'next/image';
import Link from 'next/link';

interface AgendaItem {
  id: string;
  titulo: string;
  slug?: string;
  descripcion?: string;
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

interface EventoFecha {
  id: string;
  fecha: string;
  titulo: string;
  categoria?: string;
  disponible: boolean;
  activo: boolean;
  imagen_url?: string;
  link_tickets?: string;
}

const formatearFecha = (fechaStr: string) => {
  const fecha = new Date(fechaStr);
  const dias = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SAB'];
  const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  return `${dias[fecha.getDay()]} ${fecha.getDate()} ${meses[fecha.getMonth()]}`;
};

export const EventosHome = () => {
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [eventosFecha, setEventosFecha] = useState<EventoFecha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = () => {
      const section = document.getElementById('eventos-section');
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const inView = rect.top < window.innerHeight + 200 && rect.bottom > -200;

      if (inView && !timeout) {
        timeout = setTimeout(() => {
          section.style.backgroundColor = '#BC2915';
          section.style.transition = 'background-color 0.6s ease';
        }, 1000);
      } else if (!inView) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        section.style.backgroundColor = '#F5F0E8';
        section.style.transition = '';
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  const fetchData = async () => {
    setError(null);
    try {
      const [agendaRes, eventosRes] = await Promise.all([
        supabase.from('agenda').select('*').eq('activo', true).order('created_at', { ascending: true }),
        supabase.from('eventos').select('*').eq('activo', true).order('fecha', { ascending: true })
      ]);

      if (agendaRes.error) {
        console.error('Error fetching agenda:', agendaRes.error);
        throw agendaRes.error;
      }
      if (eventosRes.error) {
        console.error('Error fetching eventos:', eventosRes.error);
        throw eventosRes.error;
      }

      console.log('Agenda items:', agendaRes.data?.length);
      console.log('Eventos items:', eventosRes.data?.length);

      setAgendaItems(agendaRes.data || []);
      setEventosFecha(eventosRes.data || []);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Error al cargar eventos');
      setAgendaItems([]);
      setEventosFecha([]);
    }
    setLoading(false);
  };

  const toggleAccordion = (id: string) => {
    setOpenId(prev => prev === id ? null : id);
  };

  if (loading) {
    return (
      <section className="py-8 sm:py-12 md:py-24 px-4 sm:px-8 md:px-[96px]" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="mx-auto">
          <div className="text-center text-black/60 py-8">Cargando eventos...</div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="eventos-section"
      className="relative overflow-hidden"
      style={{ backgroundColor: '#F5F0E8' }}
    >
      {/* Ilustraciones decorativas — distribuidas */}
      <div className="hidden sm:block absolute inset-0 pointer-events-none select-none z-0">
        {([
          // ═══ AGENDA (zona superior) — reducidas a la mitad ═══
          { src: 'esfera.png', x: '12%', y: '5%', r: -8, static: true },
          { src: 'IMG_2704.png', x: '35%', y: '4%', r: 10, d: 0.1 },
          { src: 'IMG_2693.png', x: '62%', y: '6%', r: -12, d: 0.8 },
          { src: 'IMG_2706.png', x: '85%', y: '4%', r: -8, d: 0.4 },
          { src: 'IMG_2714.png', x: '18%', y: '22%', r: 18, d: 1.1 },
          { src: 'ventana.png', x: '50%', y: '20%', r: 6, static: true },
          { src: 'IMG_2704.png', x: '75%', y: '24%', r: -10, d: 0.6 },
          { src: 'vinilo.png', x: '8%', y: '32%', r: 12, d: 0.3 },

          // ═══ EVENTOS (zona inferior) — distribución orgánica ═══
          { src: 'IMG_2706.png', x: '22%', y: '35%', r: 20, d: 0.9 },
          { src: 'IMG_2693.png', x: '68%', y: '35%', r: -12, d: 1.4 },
          { src: 'IMG_2704.png', x: '45%', y: '55%', r: 14, d: 0.2 },
          { src: 'IMG_2714.png', x: '88%', y: '55%', r: -22, d: 1.0 },
          { src: 'IMG_2693.png', x: '15%', y: '60%', r: 22, d: 1.3 },
          { src: 'IMG_2693.png', x: '55%', y: '54%', r: 22, d: 1.3 },
          { src: 'IMG_2704.png', x: '80%', y: '56%', r: -14, d: 0.7 },
          { src: 'IMG_2714.png', x: '32%', y: '60%', r: 8, d: 1.6 },
          { src: 'IMG_2706.png', x: '5%', y: '65%', r: -18, d: 0.1 },
          { src: 'IMG_2704.png', x: '70%', y: '64%', r: 22, d: 0.8 },
          { src: 'IMG_2693.png', x: '42%', y: '68%', r: -10, d: 1.5 },
          { src: 'vinilo.png', x: '92%', y: '70%', r: 20, d: 0.4 },
          { src: 'IMG_2714.png', x: '18%', y: '74%', r: -12, d: 1.2 },
          { src: 'IMG_2706.png', x: '60%', y: '76%', r: 18, d: 0.3 },
          { src: 'IMG_2704.png', x: '35%', y: '80%', r: -20, d: 0.9 },
          { src: 'IMG_2693.png', x: '78%', y: '82%', r: 15, d: 1.7 },
          { src: 'ventana.png', x: '10%', y: '86%', r: -6, static: true },
          { src: 'IMG_2714.png', x: '50%', y: '88%', r: 10, d: 0.6 },
          { src: 'IMG_2706.png', x: '85%', y: '90%', r: -16, d: 1.1 },
          { src: 'esfera.png', x: '28%', y: '92%', r: 6, static: true },
          { src: 'IMG_2704.png', x: '65%', y: '94%', r: -8, d: 0.2 },
        ] as Array<{ src: string; x: string; y: string; r: number; static?: boolean; d?: number }>).map((item, i) => {
          const img = (
            <Image
              src={`/ilustraciones/prod-ilustr/${item.src}`}
              alt="" width={48} height={48}
              style={{
                opacity: item.static ? 0.35 : 0.3,
                transform: `rotate(${item.r}deg)`,
                filter: 'brightness(0) saturate(0) invert(1) brightness(4)',
              }}
            />
          );
          if (item.static) {
            return <div key={i} className="absolute" style={{ left: item.x, top: item.y }}>{img}</div>;
          }
          const delay = item.d ?? 0;
          return (
            <motion.div
              key={i}
              className="absolute"
              style={{ left: item.x, top: item.y }}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2.4 + (i % 3) * 0.4, ease: 'easeInOut', repeat: Infinity, delay }}
            >
              {img}
            </motion.div>
          );
        })}
      </div>
      {/* ============================================ */}
      {/* SECCIÓN 1: AGENDA (ACORDEÓN)                */}
      {/* ============================================ */}
      <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-8 md:px-[96px]">
        <div className="mx-auto">
          <div className="text-left mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium leading-tight uppercase tracking-tighter italic text-white">
              Agenda
            </h2>
          </div>

          {error && (
            <div className="text-center text-red-600 py-4 text-sm mb-6">
              {error}
            </div>
          )}

          {agendaItems.length === 0 ? (
            <div className="text-center text-white/60 py-12">
              <p className="text-lg mb-2 text-white/80">No hay eventos en la agenda</p>
              <p className="text-sm text-white/60">Próximamente estaremos anunciando nuevas fechas</p>
            </div>
          ) : (
            <div>
              {agendaItems.map((item, index) => {
                const isOpen = openId === item.id;

                return (
                  <div key={item.id}>
                    {/* Fila del acordeón */}
                    <div
                      className="flex items-center justify-between py-5 sm:py-7 cursor-pointer select-none"
                      onClick={() => toggleAccordion(item.id)}
                    >
                      {/* Categoría badge + título */}
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-baseline gap-3 flex-wrap">
                          {item.categoria && (
                            <span className="text-[11px] sm:text-[12px] font-black uppercase tracking-widest text-white shrink-0">
                              {item.categoria.toUpperCase()}
                            </span>
                          )}
                          <h4 className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-tight text-white leading-none">
                            {item.slug ? (
                              <Link
                                href={`/agenda/${item.slug}`}
                                onClick={e => e.stopPropagation()}
                                className="hover:text-white/70 transition-colors"
                              >
                                {item.titulo}
                              </Link>
                            ) : (
                              item.titulo
                            )}
                          </h4>
                        </div>
                      </div>

                      {/* Acciones derecha */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {item.luma_url ? (
                          <a
                            href={item.luma_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] sm:text-xs font-black uppercase tracking-widest bg-white text-black px-4 py-2 hover:bg-gray-100 transition-colors whitespace-nowrap"
                            onClick={e => e.stopPropagation()}
                          >
                            INSCRIBIRME
                          </a>
                        ) : null}
                        <button
                          className={`flex items-center justify-center w-9 h-9 border-2 border-white/50 rounded-full transition-transform duration-300 hover:border-white ${isOpen ? 'rotate-45' : ''}`}
                          onClick={e => { e.stopPropagation(); toggleAccordion(item.id); }}
                        >
                          <Plus size={18} className="text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Contenido expandible */}
                    <div
                      className="overflow-hidden transition-all duration-300 ease-in-out"
                      style={{ maxHeight: isOpen ? '400px' : '0px', opacity: isOpen ? 1 : 0 }}
                    >
                      <div className="pb-5 pt-1 pl-0 space-y-3">
                        {item.descripcion && (
                          <p className="text-base sm:text-lg text-white/85 leading-relaxed">
                            {item.descripcion}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-x-10 gap-y-3 text-sm sm:text-base text-white/70">
                          {item.frecuencia && (
                            <div>
                              <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold block mb-0.5">Frecuencia</span>
                              <span className="font-medium text-white">{item.frecuencia}</span>
                            </div>
                          )}
                          {item.duracion && (
                            <div>
                              <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold block mb-0.5">Duración</span>
                              <span className="font-medium text-white">{item.duracion}</span>
                            </div>
                          )}
                          {item.precio !== undefined && (
                            <div>
                              <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold block mb-0.5">Precio</span>
                              <span className="font-medium text-white">{item.precio > 0 ? `$${item.precio.toLocaleString('es-AR')}` : 'Gratis'}</span>
                            </div>
                          )}
                          {item.cupos_maximos && item.cupos_maximos > 0 && (
                            <div>
                              <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold block mb-0.5">Cupos</span>
                              <span className="font-medium text-white">{item.cupos_maximos}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Separador siempre presente */}
                    <div className="border-b border-white/20" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* SECCIÓN 2: EVENTOS (CARRUSEL)               */}
      {/* ============================================ */}
      <div className="pb-12 sm:pb-16 md:pb-20 pt-8 sm:pt-10 px-0 sm:px-8 md:px-[96px]">
        <div className="mx-auto">
          <div className="flex items-end justify-between mb-6 sm:mb-8 px-4 sm:px-0">
            <h2 id="eventos-titulo" className="text-3xl sm:text-4xl md:text-5xl font-medium leading-tight uppercase tracking-tighter italic text-white">
              Eventos
            </h2>
            <Link
              href="/calendario"
              className="shrink-0 text-[10px] sm:text-xs font-black uppercase tracking-widest border border-white/40 text-white px-4 py-2 rounded-full hover:bg-white hover:text-black transition-colors whitespace-nowrap"
            >
              Ver calendario
            </Link>
          </div>

          {eventosFecha.length === 0 ? (
            <div className="text-center text-white/60 py-12 px-4 sm:px-0">
              <p className="text-lg mb-2 text-white/80">No hay próximos eventos</p>
              <p className="text-sm text-white/60">Muy pronto estaremos anunciando nuevas fechas</p>
            </div>
          ) : (
            <>
              <div
                ref={scrollRef}
                className="flex gap-[10px] overflow-x-auto snap-x snap-mandatory scrollbar-none"
              >
                {/* Espaciador izquierdo para dar padding al primer card en mobile */}
                <div className="snap-none w-4 sm:w-0 shrink-0" />
                {eventosFecha.map((evento) => (
                  <a
                    key={evento.id}
                    href={evento.link_tickets || undefined}
                    target={evento.link_tickets ? '_blank' : undefined}
                    rel={evento.link_tickets ? 'noopener noreferrer' : undefined}
                    className="group relative flex-shrink-0 w-[260px] sm:w-[280px] lg:w-[320px] aspect-[3/4] snap-start overflow-hidden cursor-pointer"
                  >
                    {/* Imagen */}
                    <div className="absolute inset-0 bg-gray-900">
                      {evento.imagen_url ? (
                        <Image
                          src={evento.imagen_url}
                          alt={evento.titulo}
                          fill
                          className="object-cover transition-all duration-700 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800 p-6">
                          <h4 className="text-white font-bold text-center text-sm uppercase leading-tight">
                            {evento.titulo}
                          </h4>
                        </div>
                      )}
                    </div>

                    {/* Overlay hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />

                    {/* Gradiente inferior */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

                    {/* Esquina inferior derecha — solo botón */}
                    <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-10">
                      {evento.disponible ? (
                        <span className="inline-flex items-center text-[10px] sm:text-xs font-black uppercase tracking-widest bg-black text-white px-3 py-1.5 hover:bg-gray-800 transition-colors">
                          TICKETS →
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] sm:text-xs font-black uppercase tracking-widest bg-black/60 text-white/80 px-3 py-1.5">
                          SOLD OUT
                        </span>
                      )}
                    </div>
                  </a>
                ))}
                {/* Espaciador derecho para dar padding al último card en mobile */}
                <div className="snap-none w-4 sm:w-0 shrink-0" />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
