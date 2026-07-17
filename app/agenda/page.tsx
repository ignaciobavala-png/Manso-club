'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { ParticleBackground } from '@/components/Home/ParticleBackground';
import Link from 'next/link';
import Image from 'next/image';
import { Users, Lock, CalendarDays } from 'lucide-react';
import { ShareButton } from '@/components/ShareButton';

type Nivel = 'publico' | 'registrado' | 'miembro';

const NIVELES_VISIBLES: Record<Nivel, string[]> = {
  publico:    ['publico'],
  registrado: ['publico', 'registrado'],
  miembro:    ['publico', 'registrado', 'miembro'],
};

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

interface AgendaItem {
  id: string;
  titulo: string;
  descripcion?: string;
  slug?: string;
  fecha?: string;
  categoria?: string;
  duracion?: string;
  frecuencia?: string;
  dia_semana?: number | null;
  horario?: string | null;
  precio?: number;
  cupos_maximos?: number;
  clases?: number;
  luma_url?: string;
  whatsapp_contacto?: string;
  activo: boolean;
  orden: number;
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
// 0 = lunes ... 6 = domingo (convención de agenda.dia_semana)
const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

export default function AgendaPage() {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [eventosFecha, setEventosFecha] = useState<EventoFecha[]>([]);
  const [loading, setLoading] = useState(true);
  const [nivel, setNivel] = useState<Nivel>('publico');
  const [hayOcultos, setHayOcultos] = useState(false);

  const now = new Date();
  const mesActual = MESES[now.getMonth()];
  const anioActual = now.getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Determinar nivel del usuario
        let nivelActual: Nivel = 'publico';
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('permisos_totales')
            .eq('id', user.id)
            .single();
          nivelActual = profile?.permisos_totales ? 'miembro' : 'registrado';
        }
        setNivel(nivelActual);

        const nivelesVisibles = NIVELES_VISIBLES[nivelActual];

        const [agendaRes, todasRes, eventosRes] = await Promise.all([
          supabase
            .from('agenda')
            .select('*')
            .eq('activo', true)
            .in('visibilidad', nivelesVisibles)
            .order('created_at', { ascending: true }),
          nivelActual !== 'miembro'
            ? supabase.from('agenda').select('visibilidad').eq('activo', true)
            : Promise.resolve({ data: [] }),
          supabase.from('eventos').select('*').eq('activo', true).order('fecha', { ascending: true }),
        ]);

        setItems(agendaRes.data || []);
        setEventosFecha(eventosRes.data || []);

        const todas = (todasRes.data || []) as { visibilidad: string }[];
        setHayOcultos(nivelActual !== 'miembro' && todas.some(i => !nivelesVisibles.includes(i.visibilidad)));
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
            <motion.h1
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none text-manso-cream"
            >
              Agenda
            </motion.h1>
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

        {/* CTA principal al calendario */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="mb-16"
        >
          <Link
            href="/calendario"
            className="group flex items-center justify-between gap-5 border border-manso-cream/15 rounded-3xl p-5 md:p-7 hover:border-manso-cream/40 hover:bg-manso-cream/5 transition-all duration-500"
          >
            <div className="flex items-center gap-4 md:gap-6">
              <CalendarDays
                size={30}
                strokeWidth={1.4}
                className="shrink-0 text-manso-terra"
              />
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.6em] text-manso-terra mb-1.5">
                  Talleres + Eventos
                </p>
                <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter leading-none text-manso-cream">
                  Ver calendario
                </h2>
                <p className="hidden md:block text-sm text-manso-cream/40 font-light mt-2 max-w-md leading-relaxed">
                  Toda la programación del mes en una sola vista, día por día y con horarios.
                </p>
              </div>
            </div>
            <span className="shrink-0 w-11 h-11 flex items-center justify-center rounded-full border border-manso-cream/20 text-manso-cream group-hover:bg-manso-cream group-hover:text-manso-black group-hover:border-manso-cream transition-all duration-500 text-lg">
              →
            </span>
          </Link>
        </motion.div>

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
                      className="group border-b border-manso-cream/8 py-8 md:py-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10 hover:bg-manso-cream/[0.03] transition-colors -mx-4 px-4 cursor-default"
                    >
                      {/* Título + descripción */}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-manso-cream leading-tight">
                          {item.slug ? (
                            <Link href={`/agenda/${item.slug}`} className="hover:text-manso-terra transition-colors">
                              {item.titulo}
                            </Link>
                          ) : (
                            item.titulo
                          )}
                        </h2>
                        {item.descripcion && (
                          <p className="text-sm text-manso-cream/40 mt-2 font-light leading-relaxed max-w-xl">
                            {item.descripcion.split('\n').map(p => p.trim()).find(p => p.length > 0)}
                          </p>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="flex flex-wrap md:flex-nowrap items-center gap-6 md:gap-10 flex-shrink-0">
                        {typeof item.dia_semana === 'number' && DIAS[item.dia_semana] && (
                          <div className="text-right">
                            <p className="text-[9px] uppercase tracking-widest text-manso-cream/25 font-black mb-0.5">Día</p>
                            <p className="text-sm font-black uppercase tracking-wide text-manso-cream/70">
                              {DIAS[item.dia_semana]}
                              {item.horario && <span className="text-manso-cream/40"> · {item.horario.slice(0, 5)} hs</span>}
                            </p>
                          </div>
                        )}
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
                        {item.clases ? (
                          <div className="text-right">
                            <p className="text-[9px] uppercase tracking-widest text-manso-cream/25 font-black mb-0.5">Clases</p>
                            <p className="text-sm font-black uppercase tracking-wide text-manso-cream/70">{item.clases}</p>
                          </div>
                        ) : null}
                        <div className="text-right min-w-[70px]">
                          <p className="text-[9px] uppercase tracking-widest text-manso-cream/25 font-black mb-0.5">Precio</p>
                          <p className="text-base font-black text-manso-cream">
                            {!item.precio || item.precio === 0 ? 'Gratis' : `$${item.precio.toLocaleString('es-AR')}`}
                          </p>
                        </div>
                      </div>

                      {/* CTA Inscripción + Compartir */}
                      <div className="flex-shrink-0 ml-0 md:ml-6 flex items-center gap-3">
                        <ShareButton
                          title={`${item.titulo} | Manso Club`}
                          text={item.descripcion || `${item.titulo} en Manso Club.`}
                          url={item.slug ? `/agenda/${item.slug}` : '/agenda'}
                          className="flex items-center justify-center w-11 h-11 bg-manso-cream/5 border border-manso-cream/10 rounded-full text-manso-cream hover:bg-manso-cream/10 hover:border-manso-cream/20 transition-all"
                          label=""
                        />
                        <a
                          href={`/agenda/pagar?titulo=${encodeURIComponent(item.titulo)}&precio=${item.precio || 0}&frecuencia=${encodeURIComponent(item.frecuencia || '')}&categoria=${encodeURIComponent(item.categoria || '')}`}
                          className="bg-manso-cream text-manso-black hover:bg-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap min-h-[44px] flex items-center"
                        >
                          Inscribirme
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Gate — eventos ocultos por nivel */}
        {hayOcultos && (
          <div className={`flex items-center gap-4 p-5 rounded-2xl border mt-12 ${
            nivel === 'publico'
              ? 'bg-manso-blue/10 border-manso-blue/30'
              : 'bg-manso-terra/10 border-manso-terra/30'
          }`}>
            {nivel === 'publico'
              ? <Users size={20} className="text-manso-blue shrink-0" />
              : <Lock size={20} className="text-manso-terra shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-manso-cream">
                {nivel === 'publico'
                  ? 'Hay eventos exclusivos para miembros registrados'
                  : 'Hay eventos exclusivos para miembros'}
              </p>
              <p className="text-xs text-manso-cream/50 mt-0.5">
                {nivel === 'publico'
                  ? 'Creá tu cuenta gratis para acceder'
                  : 'Activá tu membresía para desbloquearlos'}
              </p>
            </div>
            <Link
              href={nivel === 'publico' ? '/login' : '/membresias'}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                nivel === 'publico'
                  ? 'bg-manso-blue text-manso-cream hover:bg-manso-blue/80'
                  : 'bg-manso-terra text-manso-cream hover:bg-manso-terra/80'
              }`}
            >
              {nivel === 'publico' ? 'Registrarse' : 'Ver membresías'}
            </Link>
          </div>
        )}

        {/* Carrusel de eventos / flyers */}
        {eventosFecha.length > 0 && (
          <div className="mt-24">
            <div className="flex items-center gap-4 mb-8">
              <span className="text-[9px] font-black uppercase tracking-[0.6em] text-manso-terra">Eventos</span>
              <div className="flex-1 h-px bg-manso-cream/10" />
            </div>
            <div className="flex gap-[10px] overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-6 md:-mx-12 px-6 md:px-12">
              {eventosFecha.map((evento) => (
                <a
                  key={evento.id}
                  href={evento.link_tickets || undefined}
                  target={evento.link_tickets ? '_blank' : undefined}
                  rel={evento.link_tickets ? 'noopener noreferrer' : undefined}
                  className="group relative flex-shrink-0 w-[220px] sm:w-[260px] lg:w-[300px] aspect-[3/4] snap-start overflow-hidden"
                >
                  <div className="absolute inset-0 bg-manso-blue/30">
                    {evento.imagen_url ? (
                      <Image
                        src={evento.imagen_url}
                        alt={evento.titulo}
                        fill
                        className="object-cover transition-all duration-700 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-6">
                        <h4 className="text-manso-cream font-bold text-center text-sm uppercase leading-tight">
                          {evento.titulo}
                        </h4>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 right-3 z-10">
                    {evento.disponible ? (
                      <span className="inline-flex items-center text-[10px] font-black uppercase tracking-widest bg-manso-cream text-manso-black px-3 py-1.5">
                        TICKETS →
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-black uppercase tracking-widest bg-black/60 text-white/80 px-3 py-1.5">
                        SOLD OUT
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
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
