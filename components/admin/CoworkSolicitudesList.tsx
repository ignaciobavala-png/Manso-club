'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CalendarDays, Crown } from 'lucide-react';
import { CoworkOpenCowork } from './CoworkOpenCowork';
import { CoworkMembresias } from './CoworkMembresias';
import type { CuentaDelSolicitante, Estado, Fecha, Solicitud } from './CoworkTypes';

type Seccion = 'open_cowork' | 'membresia';

/**
 * Solicitudes se parte en dos porque son dos negocios distintos: Open Cowork es
 * logística de un encuentro gratuito (quién viene qué día), y las de membresía
 * son gente dispuesta a pagar un mes (de qué card salieron y si ya está activa).
 */
export function CoworkSolicitudesList() {
  const [seccion, setSeccion] = useState<Seccion>('open_cowork');
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [fechas, setFechas] = useState<Fecha[]>([]);
  const [cuentas, setCuentas] = useState<Map<string, CuentaDelSolicitante>>(new Map());
  const [loading, setLoading] = useState(true);

  // Arranca en loading; los refrescos posteriores actualizan sin spinner.
  const fetchTodo = async () => {
    const [{ data: sols }, { data: fchs }] = await Promise.all([
      supabase.from('cowork_solicitudes').select('*').order('created_at', { ascending: false }),
      supabase.from('cowork_fechas').select('id, fecha, horario, horario_fin, cupos_maximos, activo').order('fecha', { ascending: true }),
    ]);

    const solicitudesData = (sols as Solicitud[]) ?? [];
    setSolicitudes(solicitudesData);
    setFechas(fchs ?? []);

    // Cruce por mail contra user_profiles: de ahí sale si ya tiene la membresía
    // activa, que es lo que Ana entiende por "pagado".
    const mails = Array.from(
      new Set(
        solicitudesData
          .filter(s => s.origen === 'membresia')
          .map(s => s.email.trim().toLowerCase()),
      ),
    );

    if (mails.length > 0) {
      const { data: perfiles } = await supabase
        .from('user_profiles')
        .select('id, email, membresia_activa, membresia_hasta')
        .in('email', mails);

      setCuentas(
        new Map(
          (perfiles ?? []).map((p: CuentaDelSolicitante) => [p.email.trim().toLowerCase(), p]),
        ),
      );
    } else {
      setCuentas(new Map());
    }

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

  const deOpenCowork = solicitudes.filter(s => s.origen === 'open_cowork');
  const deMembresia = solicitudes.filter(s => s.origen === 'membresia');
  const pendientes = (lista: Solicitud[]) => lista.filter(s => s.estado === 'pendiente').length;

  const SECCIONES: { id: Seccion; label: string; icon: React.ReactNode; sin: number }[] = [
    { id: 'open_cowork', label: 'Open Cowork', icon: <CalendarDays size={13} />, sin: pendientes(deOpenCowork) },
    { id: 'membresia',   label: 'Membresías',  icon: <Crown size={13} />,        sin: pendientes(deMembresia) },
  ];

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-manso-cream/30 py-8">
        <div className="w-4 h-4 border border-manso-cream/20 border-t-manso-cream/60 rounded-full animate-spin" />
        <span className="text-[10px] uppercase tracking-widest font-black">Cargando...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Pestañas */}
      <div className="flex gap-1 p-1 bg-manso-cream/5 rounded-2xl mb-6">
        {SECCIONES.map(s => (
          <button
            key={s.id}
            onClick={() => setSeccion(s.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              seccion === s.id
                ? 'bg-manso-terra text-manso-cream'
                : 'text-manso-cream/40 hover:text-manso-cream/70'
            }`}
          >
            {s.icon}
            {s.label}
            {s.sin > 0 && (
              <span
                className={`min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[9px] ${
                  seccion === s.id ? 'bg-manso-cream/25' : 'bg-yellow-500/20 text-yellow-400'
                }`}
                title={`${s.sin} sin responder`}
              >
                {s.sin}
              </span>
            )}
          </button>
        ))}
      </div>

      {seccion === 'open_cowork' ? (
        <CoworkOpenCowork
          fechas={fechas}
          solicitudes={deOpenCowork}
          onRefetch={fetchTodo}
          onEstado={cambiarEstado}
          onBorrar={borrar}
        />
      ) : (
        <CoworkMembresias
          solicitudes={deMembresia}
          cuentas={cuentas}
          onRefetch={fetchTodo}
          onEstado={cambiarEstado}
          onBorrar={borrar}
        />
      )}
    </div>
  );
}
