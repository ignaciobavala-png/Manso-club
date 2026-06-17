'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, ChevronDown, X, CheckCircle, Ban } from 'lucide-react';
import { GestionEvent } from './CRMAdmin';

interface Registration {
  id: string;
  name: string;
  email: string;
  instagram: string | null;
  phone: string | null;
  registered_at: string;
  used_at: string | null;
  payment_verified: boolean;
  is_banned: boolean;
}

interface Guest {
  id: string;
  name: string;
  type: string;
  created_at: string;
}

type SubTab = 'registraciones' | 'guests';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' });
}

function EventDetail({ eventId, event, onClose }: { eventId: string; event: GestionEvent; onClose: () => void }) {
  const [subTab, setSubTab] = useState<SubTab>('registraciones');
  const [registrations, setRegistrations] = useState<Registration[] | null>(null);
  const [guests, setGuests] = useState<Guest[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      if (subTab === 'registraciones' && !registrations) {
        const r = await fetch(`/api/gestion/events/${eventId}/registrations`);
        const d = await r.json();
        setRegistrations(d.registrations ?? []);
      }
      if (subTab === 'guests' && !guests) {
        const r = await fetch(`/api/gestion/events/${eventId}/guests`);
        const d = await r.json();
        setGuests(d.guests ?? []);
      }
      setLoading(false);
    };
    fetch_();
  }, [subTab, eventId]);

  const ocupacion = event.max_capacity
    ? Math.round((event.registrations_count / event.max_capacity) * 100)
    : null;

  return (
    <div className="mt-2 bg-manso-black/40 border border-manso-cream/10 rounded-2xl overflow-hidden">
      {/* Stats del evento */}
      <div className="px-4 pt-4 pb-3 grid grid-cols-3 gap-2 border-b border-manso-cream/5">
        <div className="text-center">
          <p className="text-lg font-black text-manso-cream">{event.registrations_count}</p>
          <p className="text-[8px] uppercase tracking-widest text-manso-cream/30">Registraciones</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-black text-manso-cream">{event.ticket_sales_count}</p>
          <p className="text-[8px] uppercase tracking-widest text-manso-cream/30">Tickets puerta</p>
        </div>
        <div className="text-center">
          <p className={`text-lg font-black ${ocupacion !== null && ocupacion >= 80 ? 'text-manso-terra' : 'text-manso-cream'}`}>
            {ocupacion !== null ? `${ocupacion}%` : '—'}
          </p>
          <p className="text-[8px] uppercase tracking-widest text-manso-cream/30">Ocupación</p>
        </div>
      </div>

      {/* Barra de capacidad */}
      {ocupacion !== null && (
        <div className="px-4 py-2 border-b border-manso-cream/5">
          <div className="h-1 bg-manso-cream/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${ocupacion >= 90 ? 'bg-manso-terra' : ocupacion >= 70 ? 'bg-yellow-400' : 'bg-green-400'}`}
              style={{ width: `${Math.min(ocupacion, 100)}%` }}
            />
          </div>
          <p className="text-[7px] text-manso-cream/20 mt-1 text-right">{event.registrations_count}/{event.max_capacity} cupos</p>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex gap-1">
          {(['registraciones', 'guests'] as SubTab[]).map(t => (
            <button
              key={t}
              onClick={() => setSubTab(t)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                subTab === t ? 'bg-manso-terra text-white' : 'text-manso-cream/40 hover:text-manso-cream'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="text-manso-cream/20 hover:text-manso-cream transition-colors">
          <X size={13} />
        </button>
      </div>

      <div className="p-4">
        {loading && (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-manso-terra/30 border-t-manso-terra rounded-full animate-spin" />
          </div>
        )}

        {!loading && subTab === 'registraciones' && registrations && (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            <p className="text-[9px] font-black uppercase tracking-widest text-manso-cream/30 mb-2">
              {registrations.length} registraciones · {registrations.filter(r => r.used_at).length} ingresaron
            </p>
            {registrations.length === 0 && <p className="text-xs text-manso-cream/30">Sin registraciones</p>}
            {registrations.map(r => (
              <div key={r.id} className="flex items-center justify-between gap-2 px-3 py-2 bg-manso-cream/5 rounded-xl">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-manso-cream truncate">{r.name}</p>
                  <p className="text-[9px] text-manso-cream/40 truncate">
                    {r.email}{r.instagram ? ` · @${r.instagram}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {r.used_at && <CheckCircle size={11} className="text-green-400" />}
                  {r.is_banned && <Ban size={11} className="text-red-400" />}
                  {r.payment_verified && (
                    <span className="text-[7px] font-black px-1.5 py-0.5 bg-manso-olive/10 border border-manso-olive/20 rounded text-manso-olive">$</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && subTab === 'guests' && guests && (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            <p className="text-[9px] font-black uppercase tracking-widest text-manso-cream/30 mb-2">{guests.length} guests</p>
            {guests.length === 0 && <p className="text-xs text-manso-cream/30">Sin guests</p>}
            {guests.map(g => (
              <div key={g.id} className="flex items-center justify-between px-3 py-2 bg-manso-cream/5 rounded-xl">
                <p className="text-xs text-manso-cream">{g.name}</p>
                <span className="text-[8px] font-black uppercase tracking-widest text-manso-cream/30">{g.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface CRMEventosProps {
  events: GestionEvent[];
}

export function CRMEventos({ events }: CRMEventosProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const now = new Date();

  const proximos = events.filter(e => new Date(e.start_date) >= now)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  const pasados = events.filter(e => new Date(e.start_date) < now)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  const renderEvent = (event: GestionEvent) => {
    const isExpanded = expanded === event.id;
    return (
      <div key={event.id}>
        <button
          onClick={() => setExpanded(isExpanded ? null : event.id)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-manso-cream/5 border border-manso-cream/10 rounded-2xl hover:border-manso-cream/30 transition-all text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-bold text-manso-cream truncate">{event.name}</p>
                {event.is_private && (
                  <span className="text-[7px] font-black uppercase px-1.5 py-0.5 bg-manso-blue/20 border border-manso-blue/30 rounded-full text-blue-300 flex-shrink-0">Privado</span>
                )}
                {event.is_active && (
                  <span className="text-[7px] font-black uppercase px-1.5 py-0.5 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 flex-shrink-0">En curso</span>
                )}
              </div>
              <p className="text-[9px] text-manso-cream/40">{formatDate(event.start_date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1 text-manso-cream/40">
              <Users size={11} />
              <span className="text-[10px] font-black">{event.registrations_count}</span>
              {event.max_capacity && (
                <span className="text-[9px] text-manso-cream/20">/{event.max_capacity}</span>
              )}
            </div>
            <ChevronDown size={13} className={`text-manso-cream/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {isExpanded && (
          <EventDetail eventId={event.id} event={event} onClose={() => setExpanded(null)} />
        )}
      </div>
    );
  };

  if (events.length === 0) return (
    <div className="text-center py-10">
      <Calendar size={32} className="text-manso-cream/20 mx-auto mb-3" />
      <p className="text-sm text-manso-cream/30">Sin eventos en Gestión</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {proximos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-manso-cream/50 px-1">Próximas fechas · {proximos.length}</p>
          {proximos.map(renderEvent)}
        </div>
      )}
      {pasados.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-manso-cream/25 px-1">Pasados · {pasados.length}</p>
          {pasados.map(renderEvent)}
        </div>
      )}
    </div>
  );
}
