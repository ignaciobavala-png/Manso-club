'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, Clock, Trash2, Mail, Phone, Plus, CalendarDays } from 'lucide-react';

type Estado = 'pendiente' | 'aprobado' | 'rechazado';

interface Solicitud {
  id: string;
  origen: 'membresia' | 'open_cowork';
  membresia_nombre: string | null;
  fecha_id: string | null;
  nombre: string;
  email: string;
  whatsapp: string;
  dedicacion: string;
  proyecto: string | null;
  busca: string | null;
  estado: Estado;
  created_at: string;
  cowork_fechas: { fecha: string; horario: string | null } | null;
}

interface Fecha {
  id: string;
  fecha: string;
  horario: string | null;
  cupos_maximos: number;
  activo: boolean;
}

const ESTADOS: { id: Estado; label: string; color: string }[] = [
  { id: 'pendiente', label: 'Pendiente', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25' },
  { id: 'aprobado',  label: 'Aprobado',  color: 'text-green-400 bg-green-500/10 border-green-500/25' },
  { id: 'rechazado', label: 'Rechazado', color: 'text-red-400 bg-red-500/10 border-red-500/25' },
];

const inputCls = "w-full p-2.5 bg-manso-cream/10 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none text-manso-cream text-sm";

function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function fechaLarga(fecha: string, horario: string | null) {
  const d = new Date(`${fecha}T00:00:00`);
  const texto = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  return horario ? `${texto} · ${horario.slice(0, 5)}` : texto;
}

export function CoworkSolicitudesList() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [fechas, setFechas] = useState<Fecha[]>([]);
  const [filtro, setFiltro] = useState<Estado | 'todas'>('todas');
  const [loading, setLoading] = useState(true);
  const [nuevaFecha, setNuevaFecha] = useState({ fecha: '', horario: '', cupos_maximos: '20' });

  // Arranca en loading; los refrescos posteriores actualizan sin spinner.
  const fetchTodo = async () => {
    const [{ data: sols }, { data: fchs }] = await Promise.all([
      supabase
        .from('cowork_solicitudes')
        .select('*, cowork_fechas (fecha, horario)')
        .order('created_at', { ascending: false }),
      supabase
        .from('cowork_fechas')
        .select('id, fecha, horario, cupos_maximos, activo')
        .order('fecha', { ascending: true }),
    ]);
    setSolicitudes((sols as Solicitud[]) ?? []);
    setFechas(fchs ?? []);
    setLoading(false);
  };

  useEffect(() => {
    // El setState de fetchTodo ocurre después del await, no en el cuerpo del
    // efecto; la regla no puede seguir el await y lo marca igual.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTodo();
    const handler = () => fetchTodo();
    window.addEventListener('dashboardRefresh', handler);
    return () => window.removeEventListener('dashboardRefresh', handler);
  }, []);

  const cambiarEstado = async (id: string, estado: Estado) => {
    setSolicitudes(prev => prev.map(s => (s.id === id ? { ...s, estado } : s)));
    const { error } = await supabase.from('cowork_solicitudes').update({ estado }).eq('id', id);
    if (error) fetchTodo();
  };

  const borrar = async (id: string) => {
    setSolicitudes(prev => prev.filter(s => s.id !== id));
    await supabase.from('cowork_solicitudes').delete().eq('id', id);
  };

  const agregarFecha = async () => {
    if (!nuevaFecha.fecha) return;
    await supabase.from('cowork_fechas').insert({
      fecha: nuevaFecha.fecha,
      horario: nuevaFecha.horario || null,
      cupos_maximos: Number(nuevaFecha.cupos_maximos) || 20,
    });
    setNuevaFecha({ fecha: '', horario: '', cupos_maximos: '20' });
    fetchTodo();
  };

  const toggleFecha = async (f: Fecha) => {
    await supabase.from('cowork_fechas').update({ activo: !f.activo }).eq('id', f.id);
    fetchTodo();
  };

  const borrarFecha = async (id: string) => {
    await supabase.from('cowork_fechas').delete().eq('id', id);
    fetchTodo();
  };

  const visibles = filtro === 'todas' ? solicitudes : solicitudes.filter(s => s.estado === filtro);
  const contar = (e: Estado) => solicitudes.filter(s => s.estado === e).length;
  const ocupados = (fechaId: string) =>
    solicitudes.filter(s => s.fecha_id === fechaId && s.estado !== 'rechazado').length;

  return (
    <div className="space-y-8">
      {/* ── Fechas de Open Cowork ── */}
      <div>
        <div className="flex items-center gap-2 mb-3 text-manso-cream/50">
          <CalendarDays size={13} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Fechas de Open Cowork</span>
        </div>

        <div className="space-y-2 mb-3">
          {fechas.length === 0 ? (
            <p className="text-xs text-manso-cream/30 font-light py-2">
              Sin fechas cargadas. El acordeón de la web aparece vacío hasta que sumes una.
            </p>
          ) : (
            fechas.map(f => (
              <div
                key={f.id}
                className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border ${
                  f.activo ? 'bg-manso-cream/5 border-manso-cream/10' : 'bg-transparent border-manso-cream/5 opacity-40'
                }`}
              >
                <span className="text-sm text-manso-cream font-light first-letter:uppercase">
                  {fechaLarga(f.fecha, f.horario)}
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] uppercase tracking-widest text-manso-cream/40">
                    {ocupados(f.id)} / {f.cupos_maximos}
                  </span>
                  <button
                    onClick={() => toggleFecha(f)}
                    className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40 hover:text-manso-cream transition-colors"
                  >
                    {f.activo ? 'Ocultar' : 'Mostrar'}
                  </button>
                  <button
                    onClick={() => borrarFecha(f.id)}
                    className="text-manso-cream/25 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <input
            type="date"
            className={`${inputCls} w-auto flex-1 min-w-[140px]`}
            value={nuevaFecha.fecha}
            onChange={e => setNuevaFecha(p => ({ ...p, fecha: e.target.value }))}
          />
          <input
            type="time"
            className={`${inputCls} w-auto`}
            value={nuevaFecha.horario}
            onChange={e => setNuevaFecha(p => ({ ...p, horario: e.target.value }))}
          />
          <input
            type="number"
            min="1"
            className={`${inputCls} w-20`}
            value={nuevaFecha.cupos_maximos}
            onChange={e => setNuevaFecha(p => ({ ...p, cupos_maximos: e.target.value }))}
          />
          <button
            onClick={agregarFecha}
            disabled={!nuevaFecha.fecha}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-dashed border-manso-terra/30 text-[9px] font-black uppercase tracking-widest text-manso-terra/60 hover:text-manso-terra hover:border-manso-terra/60 hover:bg-manso-terra/5 transition-all disabled:opacity-25"
          >
            <Plus size={12} />
            Sumar fecha
          </button>
        </div>
      </div>

      {/* ── Solicitudes ── */}
      <div className="border-t border-manso-cream/10 pt-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {(['todas', 'pendiente', 'aprobado', 'rechazado'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${
                filtro === f
                  ? 'bg-manso-terra text-manso-cream border-manso-terra'
                  : 'text-manso-cream/40 border-manso-cream/15 hover:text-manso-cream/70 hover:border-manso-cream/30'
              }`}
            >
              {f === 'todas' ? `Todas (${solicitudes.length})` : `${f} (${contar(f)})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-manso-cream/30 py-8">
            <div className="w-4 h-4 border border-manso-cream/20 border-t-manso-cream/60 rounded-full animate-spin" />
            <span className="text-[10px] uppercase tracking-widest font-black">Cargando...</span>
          </div>
        ) : visibles.length === 0 ? (
          <p className="text-xs text-manso-cream/30 font-light py-8 text-center">
            No hay solicitudes {filtro !== 'todas' && `en estado ${filtro}`}.
          </p>
        ) : (
          <div className="space-y-3">
            {visibles.map(s => {
              const estado = ESTADOS.find(e => e.id === s.estado)!;
              return (
                <div key={s.id} className="bg-manso-cream/5 border border-manso-cream/10 rounded-2xl p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-manso-cream font-medium text-sm">{s.nombre}</p>
                      <p className="text-[11px] text-manso-cream/35 mt-0.5">
                        {s.origen === 'open_cowork'
                          ? s.cowork_fechas
                            ? `Open Cowork · ${fechaLarga(s.cowork_fechas.fecha, s.cowork_fechas.horario)}`
                            : 'Open Cowork · sin fecha'
                          : `Plan ${s.membresia_nombre ?? '—'}`}
                        {' · '}
                        {fechaCorta(s.created_at)}
                      </p>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${estado.color}`}>
                      {estado.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-manso-cream/55 mb-3">
                    <a href={`mailto:${s.email}`} className="flex items-center gap-1.5 hover:text-manso-cream transition-colors">
                      <Mail size={12} />{s.email}
                    </a>
                    <a
                      href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-manso-cream transition-colors"
                    >
                      <Phone size={12} />{s.whatsapp}
                    </a>
                  </div>

                  <div className="space-y-1.5 text-[12.5px] text-manso-cream/70 font-light leading-relaxed">
                    <p><span className="text-manso-cream/35">Se dedica a:</span> {s.dedicacion}</p>
                    {s.proyecto && <p><span className="text-manso-cream/35">Proyecto:</span> {s.proyecto}</p>}
                    {s.busca && <p><span className="text-manso-cream/35">Busca:</span> {s.busca}</p>}
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-manso-cream/10">
                    <button
                      onClick={() => cambiarEstado(s.id, 'aprobado')}
                      disabled={s.estado === 'aprobado'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-500/25 text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-25"
                    >
                      <Check size={11} />Aprobar
                    </button>
                    <button
                      onClick={() => cambiarEstado(s.id, 'pendiente')}
                      disabled={s.estado === 'pendiente'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-yellow-500/25 text-yellow-400 hover:bg-yellow-500/10 transition-colors disabled:opacity-25"
                    >
                      <Clock size={11} />Pendiente
                    </button>
                    <button
                      onClick={() => cambiarEstado(s.id, 'rechazado')}
                      disabled={s.estado === 'rechazado'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-500/25 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-25"
                    >
                      <X size={11} />Rechazar
                    </button>
                    <button
                      onClick={() => borrar(s.id)}
                      className="ml-auto text-manso-cream/25 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
