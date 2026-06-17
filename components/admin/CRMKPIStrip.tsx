'use client';

import { Crown, AlertTriangle, XCircle, Calendar, Users, Zap } from 'lucide-react';
import { CRMUser, GestionEvent } from './CRMAdmin';

interface CRMKPIStripProps {
  users: CRMUser[];
  events: GestionEvent[];
  loading: boolean;
}

export function CRMKPIStrip({ users, events, loading }: CRMKPIStripProps) {
  const now = new Date();
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nonAdmin = users.filter(u => u.role !== 'admin');

  const activos = nonAdmin.filter(u =>
    u.membresia_activa && (!u.membresia_hasta || new Date(u.membresia_hasta) > in7days)
  ).length;

  const porVencer = nonAdmin.filter(u => {
    if (!u.membresia_activa || !u.membresia_hasta) return false;
    const d = new Date(u.membresia_hasta);
    return d > now && d <= in7days;
  }).length;

  const vencidos = nonAdmin.filter(u =>
    u.membresia_activa && !!u.membresia_hasta && new Date(u.membresia_hasta) < now
  ).length;

  const conversion = nonAdmin.length > 0 ? Math.round((activos / nonAdmin.length) * 100) : 0;

  // Próximo evento = el más cercano en el futuro
  const proximos = events
    .filter(e => new Date(e.start_date) >= now)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  const proximo = proximos[0] ?? null;

  // Evento en curso ahora mismo
  const enCurso = events.find(e => e.is_active) ?? null;

  const formatFecha = (d: string) =>
    new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });

  if (loading) {
    return (
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-shrink-0 h-16 w-32 bg-manso-cream/5 border border-manso-cream/10 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">

      {/* Miembros activos */}
      <div className="flex-shrink-0 bg-green-500/5 border border-green-500/20 rounded-2xl px-4 py-3 min-w-[120px]">
        <div className="flex items-center gap-1.5 mb-1">
          <Crown size={11} className="text-green-400" />
          <p className="text-[8px] font-black uppercase tracking-widest text-green-400/70">Activos</p>
        </div>
        <p className="text-2xl font-black text-green-400 leading-none">{activos}</p>
        <p className="text-[8px] text-green-400/50 mt-0.5">{conversion}% conversión</p>
      </div>

      {/* Por vencer */}
      <div className={`flex-shrink-0 rounded-2xl px-4 py-3 min-w-[110px] border ${
        porVencer > 0
          ? 'bg-yellow-500/5 border-yellow-500/20'
          : 'bg-manso-cream/5 border-manso-cream/10'
      }`}>
        <div className="flex items-center gap-1.5 mb-1">
          <AlertTriangle size={11} className={porVencer > 0 ? 'text-yellow-400' : 'text-manso-cream/20'} />
          <p className={`text-[8px] font-black uppercase tracking-widest ${porVencer > 0 ? 'text-yellow-400/70' : 'text-manso-cream/20'}`}>
            Vencen
          </p>
        </div>
        <p className={`text-2xl font-black leading-none ${porVencer > 0 ? 'text-yellow-400' : 'text-manso-cream/20'}`}>
          {porVencer}
        </p>
        <p className={`text-[8px] mt-0.5 ${porVencer > 0 ? 'text-yellow-400/50' : 'text-manso-cream/20'}`}>
          esta semana
        </p>
      </div>

      {/* Vencidos */}
      <div className={`flex-shrink-0 rounded-2xl px-4 py-3 min-w-[110px] border ${
        vencidos > 0
          ? 'bg-red-500/5 border-red-500/20'
          : 'bg-manso-cream/5 border-manso-cream/10'
      }`}>
        <div className="flex items-center gap-1.5 mb-1">
          <XCircle size={11} className={vencidos > 0 ? 'text-red-400' : 'text-manso-cream/20'} />
          <p className={`text-[8px] font-black uppercase tracking-widest ${vencidos > 0 ? 'text-red-400/70' : 'text-manso-cream/20'}`}>
            Vencidos
          </p>
        </div>
        <p className={`text-2xl font-black leading-none ${vencidos > 0 ? 'text-red-400' : 'text-manso-cream/20'}`}>
          {vencidos}
        </p>
        <p className={`text-[8px] mt-0.5 ${vencidos > 0 ? 'text-red-400/50' : 'text-manso-cream/20'}`}>
          reactivar
        </p>
      </div>

      {/* Separador visual */}
      <div className="flex-shrink-0 w-px bg-manso-cream/10 mx-1 self-stretch" />

      {/* Evento en curso */}
      {enCurso && (
        <div className="flex-shrink-0 bg-manso-terra/10 border border-manso-terra/30 rounded-2xl px-4 py-3 min-w-[160px]">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap size={11} className="text-manso-terra" />
            <p className="text-[8px] font-black uppercase tracking-widest text-manso-terra/70">En curso</p>
          </div>
          <p className="text-sm font-black text-manso-cream truncate max-w-[140px]">{enCurso.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[8px] text-manso-terra/60">{enCurso.registrations_count} regs</span>
            {enCurso.max_capacity && (
              <span className="text-[8px] text-manso-terra/40">/ {enCurso.max_capacity}</span>
            )}
          </div>
        </div>
      )}

      {/* Próximo evento */}
      {proximo && proximo.id !== enCurso?.id && (
        <div className="flex-shrink-0 bg-manso-cream/5 border border-manso-cream/10 rounded-2xl px-4 py-3 min-w-[160px]">
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar size={11} className="text-manso-cream/40" />
            <p className="text-[8px] font-black uppercase tracking-widest text-manso-cream/30">Próximo</p>
            {proximo.is_private && (
              <span className="text-[7px] font-black uppercase px-1 py-0.5 bg-manso-blue/20 border border-manso-blue/30 rounded text-blue-300">
                Privado
              </span>
            )}
          </div>
          <p className="text-sm font-black text-manso-cream truncate max-w-[140px]">{proximo.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[8px] text-manso-cream/40">{formatFecha(proximo.start_date)}</span>
            <span className="text-[8px] text-manso-cream/30">·</span>
            <div className="flex items-center gap-1 text-manso-cream/40">
              <Users size={8} />
              <span className="text-[8px]">{proximo.registrations_count}</span>
              {proximo.max_capacity && (
                <span className="text-[8px] text-manso-cream/20">/{proximo.max_capacity}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Si no hay eventos próximos */}
      {proximos.length === 0 && (
        <div className="flex-shrink-0 bg-manso-cream/5 border border-manso-cream/10 rounded-2xl px-4 py-3 min-w-[140px] flex items-center justify-center">
          <p className="text-[9px] text-manso-cream/20 uppercase tracking-widest">Sin próximos eventos</p>
        </div>
      )}

    </div>
  );
}
