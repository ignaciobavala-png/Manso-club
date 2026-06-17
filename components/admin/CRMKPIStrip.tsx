'use client';

import { Crown, AlertTriangle, XCircle, Calendar, Users, Zap, TrendingUp, Ticket } from 'lucide-react';
import { CRMUser, GestionEvent } from './CRMAdmin';

interface CRMKPIStripProps {
  users: CRMUser[];
  events: GestionEvent[];
  mrr: number;
  ticketsRevenue: number;
  loading: boolean;
}

export function CRMKPIStrip({ users, events, mrr, ticketsRevenue, loading }: CRMKPIStripProps) {
  const now = new Date();
  const in7days  = new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000);
  const in7daysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
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

  const nuevosEstaSemana = nonAdmin.filter(u => new Date(u.created_at) >= in7daysAgo).length;

  const proximos = events
    .filter(e => new Date(e.start_date) >= now)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  const proximo = proximos[0] ?? null;
  const enCurso = events.find(e => e.is_active) ?? null;

  const formatFecha = (d: string) =>
    new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });

  const formatARS = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n.toLocaleString('es-AR')}`;

  if (loading) return (
    <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex-shrink-0 h-[72px] w-32 bg-manso-cream/5 border border-manso-cream/10 rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="flex gap-2 mb-5 overflow-x-auto pb-1">

      {/* Ingresos por membresías */}
      <div className="flex-shrink-0 bg-manso-cream/5 border border-manso-cream/10 rounded-2xl px-4 py-3 min-w-[150px]">
        <div className="flex items-center gap-1.5 mb-1">
          <TrendingUp size={11} className="text-manso-olive" />
          <p className="text-[8px] font-black uppercase tracking-widest text-manso-cream/40">Ingresos membresías / mes</p>
        </div>
        <p className="text-2xl font-black text-manso-olive leading-none">{formatARS(mrr)}</p>
        <p className="text-[8px] text-manso-cream/30 mt-0.5">suma de planes activos vigentes</p>
      </div>

      {/* Ingresos por tickets */}
      <div className="flex-shrink-0 bg-manso-cream/5 border border-manso-cream/10 rounded-2xl px-4 py-3 min-w-[150px]">
        <div className="flex items-center gap-1.5 mb-1">
          <Ticket size={11} className="text-manso-terra" />
          <p className="text-[8px] font-black uppercase tracking-widest text-manso-cream/40">Ingresos tickets</p>
        </div>
        <p className="text-2xl font-black text-manso-terra leading-none">{formatARS(ticketsRevenue)}</p>
        <p className="text-[8px] text-manso-cream/30 mt-0.5">acumulado eventos propios</p>
      </div>

      {/* Miembros activos */}
      <div className="flex-shrink-0 bg-manso-cream/5 border border-manso-cream/10 rounded-2xl px-4 py-3 min-w-[120px]">
        <div className="flex items-center gap-1.5 mb-1">
          <Crown size={11} className="text-green-400" />
          <p className="text-[8px] font-black uppercase tracking-widest text-manso-cream/40">Activos</p>
        </div>
        <p className="text-2xl font-black text-green-400 leading-none">{activos}</p>
        <p className="text-[8px] text-manso-cream/30 mt-0.5">+{nuevosEstaSemana} esta semana</p>
      </div>

      {/* Por vencer */}
      <div className="flex-shrink-0 bg-manso-cream/5 border border-manso-cream/10 rounded-2xl px-4 py-3 min-w-[110px]">
        <div className="flex items-center gap-1.5 mb-1">
          <AlertTriangle size={11} className={porVencer > 0 ? 'text-yellow-400' : 'text-manso-cream/20'} />
          <p className="text-[8px] font-black uppercase tracking-widest text-manso-cream/40">Vencen</p>
        </div>
        <p className={`text-2xl font-black leading-none ${porVencer > 0 ? 'text-yellow-400' : 'text-manso-cream/20'}`}>{porVencer}</p>
        <p className="text-[8px] text-manso-cream/30 mt-0.5">esta semana</p>
      </div>

      {/* Vencidos */}
      <div className="flex-shrink-0 bg-manso-cream/5 border border-manso-cream/10 rounded-2xl px-4 py-3 min-w-[110px]">
        <div className="flex items-center gap-1.5 mb-1">
          <XCircle size={11} className={vencidos > 0 ? 'text-red-400' : 'text-manso-cream/20'} />
          <p className="text-[8px] font-black uppercase tracking-widest text-manso-cream/40">Vencidos</p>
        </div>
        <p className={`text-2xl font-black leading-none ${vencidos > 0 ? 'text-red-400' : 'text-manso-cream/20'}`}>{vencidos}</p>
        <p className="text-[8px] text-manso-cream/30 mt-0.5">reactivar</p>
      </div>

      {/* Separador */}
      <div className="flex-shrink-0 w-px bg-manso-cream/10 mx-1 self-stretch" />

      {/* Evento en curso */}
      {enCurso && (
        <div className="flex-shrink-0 bg-manso-cream/5 border border-manso-cream/10 rounded-2xl px-4 py-3 min-w-[170px]">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap size={11} className="text-manso-terra" />
            <p className="text-[8px] font-black uppercase tracking-widest text-manso-cream/40">En curso</p>
          </div>
          <p className="text-sm font-black text-manso-cream truncate max-w-[150px]">{enCurso.name}</p>
          {enCurso.max_capacity ? (
            <div className="mt-1.5">
              <div className="h-1 bg-manso-terra/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-manso-terra rounded-full"
                  style={{ width: `${Math.min(Math.round((enCurso.registrations_count / enCurso.max_capacity) * 100), 100)}%` }}
                />
              </div>
              <p className="text-[7px] text-manso-terra/50 mt-0.5">{enCurso.registrations_count}/{enCurso.max_capacity} cupos</p>
            </div>
          ) : (
            <p className="text-[8px] text-manso-terra/50 mt-0.5">{enCurso.registrations_count} registraciones</p>
          )}
        </div>
      )}

      {/* Próximo evento */}
      {proximo && proximo.id !== enCurso?.id && (
        <div className="flex-shrink-0 bg-manso-cream/5 border border-manso-cream/10 rounded-2xl px-4 py-3 min-w-[170px]">
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar size={11} className="text-manso-cream/40" />
            <p className="text-[8px] font-black uppercase tracking-widest text-manso-cream/30">Próximo</p>
            {proximo.is_private && (
              <span className="text-[7px] font-black uppercase px-1 py-0.5 bg-manso-blue/20 border border-manso-blue/30 rounded text-blue-300">Privado</span>
            )}
          </div>
          <p className="text-sm font-black text-manso-cream truncate max-w-[150px]">{proximo.name}</p>
          {proximo.max_capacity ? (
            <div className="mt-1.5">
              <div className="h-1 bg-manso-cream/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    Math.round((proximo.registrations_count / proximo.max_capacity) * 100) >= 80
                      ? 'bg-manso-terra' : 'bg-manso-cream/40'
                  }`}
                  style={{ width: `${Math.min(Math.round((proximo.registrations_count / proximo.max_capacity) * 100), 100)}%` }}
                />
              </div>
              <p className="text-[7px] text-manso-cream/30 mt-0.5">{formatFecha(proximo.start_date)} · {proximo.registrations_count}/{proximo.max_capacity}</p>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[8px] text-manso-cream/30">{formatFecha(proximo.start_date)}</span>
              <span className="text-[8px] text-manso-cream/20">·</span>
              <Users size={8} className="text-manso-cream/30" />
              <span className="text-[8px] text-manso-cream/30">{proximo.registrations_count}</span>
            </div>
          )}
        </div>
      )}

      {proximos.length === 0 && !enCurso && (
        <div className="flex-shrink-0 bg-manso-cream/5 border border-manso-cream/10 rounded-2xl px-4 py-3 min-w-[140px] flex items-center justify-center">
          <p className="text-[9px] text-manso-cream/20 uppercase tracking-widest">Sin próximos eventos</p>
        </div>
      )}
    </div>
  );
}
