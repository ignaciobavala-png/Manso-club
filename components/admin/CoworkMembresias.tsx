'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Crown, UserPlus, UserX, Copy, Check } from 'lucide-react';
import { CoworkSolicitudCard } from './CoworkSolicitudCard';
import { UsuarioDrawer } from './UsuarioDrawer';
import type { CuentaDelSolicitante, Estado, Solicitud } from './CoworkTypes';

const PERFIL_COLUMNAS =
  'id, email, role, display_name, avatar_url, telefono, created_at, updated_at, membresia_activa, membresia_hasta, membresia_tipo, permisos_totales, foro_baneado, foro_baneado_motivo';

// UsuarioDrawer trabaja sobre el perfil completo; lo traemos recién al abrirlo.
type PerfilCompleto = Parameters<typeof UsuarioDrawer>[0]['usuario'];

interface Props {
  solicitudes: Solicitud[];
  /** Cuentas cruzadas por mail: de acá sale si la membresía está activa. */
  cuentas: Map<string, CuentaDelSolicitante>;
  onRefetch: () => void;
  onEstado: (id: string, estado: Estado) => void;
  onBorrar: (id: string) => void;
}

/**
 * Las solicitudes de membresía son leads con plata atrás: se agrupan por la
 * card de la que salieron, y cada una muestra si esa persona ya tiene la
 * membresía activa — que es lo que Ana entiende por "pagado".
 */
export function CoworkMembresias({ solicitudes, cuentas, onRefetch, onEstado, onBorrar }: Props) {
  const [planFiltro, setPlanFiltro] = useState<string>('todos');
  const [perfil, setPerfil] = useState<PerfilCompleto | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  // Planes presentes en las solicitudes, con el nombre más reciente de cada uno.
  const planes = Array.from(
    solicitudes.reduce((acc, s) => {
      const clave = s.membresia_id ?? s.membresia_nombre ?? 'sin-plan';
      if (!acc.has(clave)) acc.set(clave, s.membresia_nombre ?? 'Sin plan');
      return acc;
    }, new Map<string, string>()),
  );

  const claveDe = (s: Solicitud) => s.membresia_id ?? s.membresia_nombre ?? 'sin-plan';
  const visibles = planFiltro === 'todos' ? solicitudes : solicitudes.filter(s => claveDe(s) === planFiltro);

  const abrirPerfil = async (email: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select(PERFIL_COLUMNAS)
      .ilike('email', email)
      .maybeSingle();
    if (data) setPerfil(data as PerfilCompleto);
  };

  const copiarRegistro = (id: string) => {
    navigator.clipboard?.writeText(`${window.location.origin}/registro`);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 2000);
  };

  if (solicitudes.length === 0) {
    return (
      <p className="text-xs text-manso-cream/30 font-light py-8 text-center">
        Todavía nadie pidió un plan desde las cards.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filtro por card */}
      {planes.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPlanFiltro('todos')}
            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${
              planFiltro === 'todos'
                ? 'bg-manso-terra text-manso-cream border-manso-terra'
                : 'text-manso-cream/40 border-manso-cream/15 hover:text-manso-cream/70 hover:border-manso-cream/30'
            }`}
          >
            Todas ({solicitudes.length})
          </button>
          {planes.map(([clave, nombre]) => (
            <button
              key={clave}
              onClick={() => setPlanFiltro(clave)}
              className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${
                planFiltro === clave
                  ? 'bg-manso-terra text-manso-cream border-manso-terra'
                  : 'text-manso-cream/40 border-manso-cream/15 hover:text-manso-cream/70 hover:border-manso-cream/30'
              }`}
            >
              {nombre} ({solicitudes.filter(s => claveDe(s) === clave).length})
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {visibles.map(s => {
          const cuenta = cuentas.get(s.email.trim().toLowerCase());
          const activa = cuenta?.membresia_activa ?? false;

          return (
            <CoworkSolicitudCard
              key={s.id}
              solicitud={s}
              contexto={<span className="text-manso-cream/50">Plan {s.membresia_nombre ?? '—'}</span>}
              onEstado={onEstado}
              onBorrar={onBorrar}
              pie={
                <div className="mt-4 pt-3 border-t border-manso-cream/10 flex flex-wrap items-center justify-between gap-3">
                  {/* Estado real de la cuenta, leído de user_profiles */}
                  {activa ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-green-400">
                      <Crown size={12} />
                      Membresía activa
                      {cuenta?.membresia_hasta && (
                        <span className="font-light tracking-normal text-manso-cream/35 normal-case">
                          hasta {new Date(cuenta.membresia_hasta).toLocaleDateString('es-AR')}
                        </span>
                      )}
                    </span>
                  ) : cuenta ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-manso-cream/40">
                      <UserPlus size={12} />
                      Registrado, sin membresía
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-manso-cream/30">
                      <UserX size={12} />
                      Sin cuenta en el sitio
                    </span>
                  )}

                  {cuenta ? (
                    <button
                      onClick={() => abrirPerfil(s.email)}
                      className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-manso-terra/40 text-manso-terra hover:bg-manso-terra/10 transition-colors"
                    >
                      {activa ? 'Ver / editar membresía' : 'Otorgar membresía'}
                    </button>
                  ) : (
                    <button
                      onClick={() => copiarRegistro(s.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-manso-cream/20 text-manso-cream/50 hover:text-manso-cream hover:border-manso-cream/40 transition-colors"
                      title="Para darle la membresía primero tiene que crear su cuenta"
                    >
                      {copiado === s.id ? <Check size={11} /> : <Copy size={11} />}
                      {copiado === s.id ? 'Copiado' : 'Link de registro'}
                    </button>
                  )}
                </div>
              }
            />
          );
        })}
      </div>

      {perfil && (
        <UsuarioDrawer
          usuario={perfil}
          onClose={() => { setPerfil(null); onRefetch(); }}
          onUpdated={setPerfil}
        />
      )}
    </div>
  );
}
