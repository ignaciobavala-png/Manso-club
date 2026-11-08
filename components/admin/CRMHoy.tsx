'use client';

import { MessageCircle } from 'lucide-react';
import { CRMUser, GestionEvent } from './CRMAdmin';

interface CRMHoyProps {
  users: CRMUser[];
  events: GestionEvent[];
  mrr: number;
}

const DIA = 24 * 60 * 60 * 1000;

const formatARS = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
const formatFecha = (d: string) =>
  new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });

function waLink(tel: string | null) {
  if (!tel) return null;
  const digits = tel.replace(/\D/g, '');
  if (digits.length < 8) return null;
  return `https://wa.me/${digits.startsWith('54') ? digits : `54${digits}`}`;
}

function dias(n: number) {
  return n === 1 ? '1 día' : `${n} días`;
}

interface Fila {
  user: CRMUser;
  detalle: string;
}

function Grupo({ titulo, ayuda, tono, filas }: {
  titulo: string;
  ayuda: string;
  tono: string;
  filas: Fila[];
}) {
  if (filas.length === 0) return null;
  const visibles = filas.slice(0, 8);
  return (
    <div className="bg-manso-cream/5 border border-manso-cream/10 rounded-2xl overflow-hidden">
      <div className="px-5 pt-4 pb-3 flex items-baseline justify-between gap-3">
        <div>
          <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${tono}`}>
            {titulo} <span className="text-manso-cream/40">· {filas.length}</span>
          </p>
          <p className="text-[10px] text-manso-cream/40 mt-0.5">{ayuda}</p>
        </div>
      </div>
      <ul className="divide-y divide-manso-cream/5">
        {visibles.map(({ user, detalle }) => {
          const wa = waLink(user.telefono);
          return (
            <li key={user.id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-manso-cream truncate">
                  {user.display_name ?? user.email}
                </p>
                <p className="text-[11px] text-manso-cream/50 truncate">{detalle}</p>
              </div>
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-manso-olive/30 text-manso-olive hover:bg-manso-olive/10 transition-colors text-[10px] font-black uppercase tracking-widest"
                >
                  <MessageCircle size={12} /> WhatsApp
                </a>
              ) : (
                <span className="flex-shrink-0 text-[10px] text-manso-cream/25">sin teléfono</span>
              )}
            </li>
          );
        })}
      </ul>
      {filas.length > visibles.length && (
        <p className="px-5 py-3 text-[10px] text-manso-cream/40 border-t border-manso-cream/5">
          y {filas.length - visibles.length} más — están en Contactos
        </p>
      )}
    </div>
  );
}

export function CRMHoy({ users, events, mrr }: CRMHoyProps) {
  const now = new Date();
  const ahora = now.getTime();
  const nonAdmin = users.filter(u => u.role !== 'admin');

  const vigente = (u: CRMUser) =>
    u.membresia_activa && (!u.membresia_hasta || new Date(u.membresia_hasta) >= now);

  const activos = nonAdmin.filter(vigente).length;

  // Vencidos: tienen el interruptor prendido pero la fecha ya pasó.
  const vencidos: Fila[] = nonAdmin
    .filter(u => u.membresia_activa && u.membresia_hasta && new Date(u.membresia_hasta) < now)
    .sort((a, b) => new Date(b.membresia_hasta!).getTime() - new Date(a.membresia_hasta!).getTime())
    .map(user => ({
      user,
      detalle: `Venció hace ${dias(Math.floor((ahora - new Date(user.membresia_hasta!).getTime()) / DIA))} (${formatFecha(user.membresia_hasta!)})${user.membresia_tipo ? ` · ${user.membresia_tipo}` : ''}`,
    }));

  const porVencer: Fila[] = nonAdmin
    .filter(u => {
      if (!u.membresia_activa || !u.membresia_hasta) return false;
      const t = new Date(u.membresia_hasta).getTime();
      return t >= ahora && t <= ahora + 7 * DIA;
    })
    .sort((a, b) => new Date(a.membresia_hasta!).getTime() - new Date(b.membresia_hasta!).getTime())
    .map(user => ({
      user,
      detalle: `Vence en ${dias(Math.max(0, Math.ceil((new Date(user.membresia_hasta!).getTime() - ahora) / DIA)))} (${formatFecha(user.membresia_hasta!)})${user.membresia_tipo ? ` · ${user.membresia_tipo}` : ''}`,
    }));

  const leadsNuevos: Fila[] = nonAdmin
    .filter(u => !u.membresia_activa && ahora - new Date(u.created_at).getTime() < 30 * DIA)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(user => ({
      user,
      detalle: `Se registró hace ${dias(Math.floor((ahora - new Date(user.created_at).getTime()) / DIA))}, todavía sin membresía`,
    }));

  const proximo = events
    .filter(e => new Date(e.start_date) >= now)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0] ?? null;

  const nada = vencidos.length + porVencer.length + leadsNuevos.length === 0;

  return (
    <div className="space-y-4 mb-5">
      {/* Tres números, nada más */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="bg-manso-cream/5 border border-manso-cream/10 rounded-2xl px-5 py-4">
          <p className="text-4xl font-black text-manso-cream leading-none">{activos}</p>
          <p className="text-[11px] font-bold text-manso-cream/70 mt-2">miembros con membresía vigente</p>
        </div>
        <div className="bg-manso-cream/5 border border-manso-cream/10 rounded-2xl px-5 py-4">
          <p className="text-4xl font-black text-manso-cream leading-none">{formatARS(mrr)}</p>
          <p className="text-[11px] font-bold text-manso-cream/70 mt-2">de membresías por mes</p>
        </div>
        <div className="bg-manso-cream/5 border border-manso-cream/10 rounded-2xl px-5 py-4">
          {proximo ? (
            <>
              <p className="text-lg font-black text-manso-cream leading-tight truncate">{proximo.name}</p>
              <p className="text-[11px] font-bold text-manso-cream/70 mt-2">
                {formatFecha(proximo.start_date)}
                {proximo.max_capacity
                  ? ` · ${proximo.registrations_count} de ${proximo.max_capacity} cupos`
                  : ` · ${proximo.registrations_count} anotados`}
                {proximo.is_private ? ' · privado' : ''}
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-black text-manso-cream/40 leading-tight">Sin eventos próximos</p>
              <p className="text-[11px] text-manso-cream/40 mt-2">cargá el siguiente en Gestión</p>
            </>
          )}
        </div>
      </div>

      {/* Qué hacer hoy */}
      <p className="text-[11px] font-black uppercase tracking-[0.25em] text-manso-cream/60 pt-1">
        Para hacer hoy
      </p>

      {nada && (
        <div className="bg-manso-cream/5 border border-manso-cream/10 rounded-2xl px-5 py-6 text-sm text-manso-cream/60">
          Nada pendiente: no hay membresías vencidas ni por vencer, y no entraron registros nuevos este mes.
        </div>
      )}

      <Grupo
        titulo="Reactivar"
        ayuda="Su membresía ya venció. Escribirles es lo que más plata recupera."
        tono="text-red-400"
        filas={vencidos}
      />
      <Grupo
        titulo="Renovar esta semana"
        ayuda="Les vence en los próximos 7 días."
        tono="text-yellow-400"
        filas={porVencer}
      />
      <Grupo
        titulo="Invitar a sumarse"
        ayuda="Se registraron en el último mes y todavía no tienen membresía."
        tono="text-manso-terra"
        filas={leadsNuevos}
      />
    </div>
  );
}
