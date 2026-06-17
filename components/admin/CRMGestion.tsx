'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, Ticket, DollarSign, ChevronDown, RefreshCw, UserCheck, X } from 'lucide-react';

interface GestionEvent {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  registrations_open: boolean;
  max_capacity: number | null;
  regular_ticket_price: number | null;
  invited_ticket_price: number | null;
  is_paid: boolean;
  is_private: boolean;
  flyer_url: string | null;
  registrations_count: number;
  ticket_sales_count: number;
}

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

interface Revenue {
  ticket_sales: { id: string; guest_name: string; type: string; price: number; created_at: string }[];
  product_sales: { id: string; product_name: string; quantity: number; total: number; payment_method: string }[];
  totals: {
    tickets_revenue: number;
    products_revenue: number;
    total_revenue: number;
    tickets_count: number;
  };
}

type SubTab = 'registraciones' | 'guests' | 'revenue';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' });
}

function formatARS(n: number) {
  return `$${n.toLocaleString('es-AR')}`;
}

function EventDetail({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const [subTab, setSubTab] = useState<SubTab>('registraciones');
  const [registrations, setRegistrations] = useState<Registration[] | null>(null);
  const [guests, setGuests] = useState<Guest[] | null>(null);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTab = async () => {
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
      if (subTab === 'revenue' && !revenue) {
        const r = await fetch(`/api/gestion/events/${eventId}/revenue`);
        const d = await r.json();
        setRevenue(d);
      }
      setLoading(false);
    };
    fetchTab();
  }, [subTab, eventId]);

  const SUB_TABS: { id: SubTab; label: string }[] = [
    { id: 'registraciones', label: 'Registraciones' },
    { id: 'guests',         label: 'Guests' },
    { id: 'revenue',        label: 'Ingresos' },
  ];

  return (
    <div className="mt-3 bg-manso-black/40 border border-manso-cream/10 rounded-2xl overflow-hidden">
      {/* Sub-tabs */}
      <div className="flex items-center justify-between px-4 pt-4 pb-0">
        <div className="flex gap-1">
          {SUB_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                subTab === t.id
                  ? 'bg-manso-terra text-white'
                  : 'text-manso-cream/40 hover:text-manso-cream'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="text-manso-cream/30 hover:text-manso-cream transition-colors">
          <X size={13} />
        </button>
      </div>

      <div className="p-4">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-manso-terra/30 border-t-manso-terra rounded-full animate-spin" />
          </div>
        )}

        {/* Registraciones */}
        {!loading && subTab === 'registraciones' && registrations && (
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            <p className="text-[9px] font-black uppercase tracking-widest text-manso-cream/30 mb-3">
              {registrations.length} registraciones
            </p>
            {registrations.length === 0 && <p className="text-xs text-manso-cream/30">Sin registraciones</p>}
            {registrations.map(r => (
              <div key={r.id} className="flex items-center justify-between gap-3 px-3 py-2 bg-manso-cream/5 rounded-xl">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-manso-cream truncate">{r.name}</p>
                  <p className="text-[9px] text-manso-cream/40 truncate">{r.email}{r.instagram ? ` · @${r.instagram}` : ''}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {r.used_at && (
                    <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full text-[7px] font-black uppercase text-green-400">
                      Ingresó
                    </span>
                  )}
                  {r.is_banned && (
                    <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full text-[7px] font-black uppercase text-red-400">
                      Ban
                    </span>
                  )}
                  {r.payment_verified && (
                    <span className="px-1.5 py-0.5 bg-manso-olive/10 border border-manso-olive/20 rounded-full text-[7px] font-black uppercase text-manso-olive">
                      Pagó
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Guests */}
        {!loading && subTab === 'guests' && guests && (
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            <p className="text-[9px] font-black uppercase tracking-widest text-manso-cream/30 mb-3">
              {guests.length} guests
            </p>
            {guests.length === 0 && <p className="text-xs text-manso-cream/30">Sin guests</p>}
            {guests.map(g => (
              <div key={g.id} className="flex items-center justify-between px-3 py-2 bg-manso-cream/5 rounded-xl">
                <p className="text-xs text-manso-cream">{g.name}</p>
                <span className="text-[8px] font-black uppercase tracking-widest text-manso-cream/40">{g.type}</span>
              </div>
            ))}
          </div>
        )}

        {/* Revenue */}
        {!loading && subTab === 'revenue' && revenue && (
          <div className="space-y-4">
            {/* Totales */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Total',     value: formatARS(revenue.totals.total_revenue),    color: 'text-manso-cream' },
                { label: 'Tickets',   value: formatARS(revenue.totals.tickets_revenue),   color: 'text-manso-terra' },
                { label: 'Productos', value: formatARS(revenue.totals.products_revenue),  color: 'text-manso-olive' },
                { label: 'Tickets vendidos', value: revenue.totals.tickets_count,         color: 'text-manso-cream/60' },
              ].map(s => (
                <div key={s.label} className="bg-manso-cream/5 border border-manso-cream/10 rounded-xl p-3">
                  <p className={`text-lg font-black leading-none ${s.color}`}>{s.value}</p>
                  <p className="text-[8px] uppercase tracking-widest text-manso-cream/30 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Detalle tickets */}
            {revenue.ticket_sales.length > 0 && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-manso-cream/30 mb-2">Ventas en puerta</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {revenue.ticket_sales.map(t => (
                    <div key={t.id} className="flex items-center justify-between px-3 py-2 bg-manso-cream/5 rounded-lg">
                      <div>
                        <p className="text-xs text-manso-cream">{t.guest_name}</p>
                        <p className="text-[8px] text-manso-cream/30 uppercase">{t.type}</p>
                      </div>
                      <p className="text-xs font-black text-manso-terra">{formatARS(t.price)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detalle productos */}
            {revenue.product_sales.length > 0 && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-manso-cream/30 mb-2">Ventas de productos</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {revenue.product_sales.map(s => (
                    <div key={s.id} className="flex items-center justify-between px-3 py-2 bg-manso-cream/5 rounded-lg">
                      <div>
                        <p className="text-xs text-manso-cream">{s.product_name}</p>
                        <p className="text-[8px] text-manso-cream/30">{s.quantity} u · {s.payment_method}</p>
                      </div>
                      <p className="text-xs font-black text-manso-olive">{formatARS(s.total)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function CRMGestion() {
  const [events, setEvents] = useState<GestionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/gestion/events');
      if (!r.ok) throw new Error('No se pudo conectar con Manso Gestión');
      const d = await r.json();
      setEvents(d.events ?? []);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-2 border-manso-terra/30 border-t-manso-terra rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="text-center py-10 space-y-3">
      <p className="text-sm text-red-400">{error}</p>
      <button onClick={fetchEvents} className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40 hover:text-manso-cream transition-colors flex items-center gap-1.5 mx-auto">
        <RefreshCw size={11} /> Reintentar
      </button>
    </div>
  );

  const now = new Date();
  const proximos = events.filter(e => new Date(e.start_date) >= now);
  const pasados  = events.filter(e => new Date(e.start_date) <  now);

  const renderEvent = (event: GestionEvent) => {
    const isExpanded = expanded === event.id;
    const capacity = event.max_capacity
      ? Math.round((event.registrations_count / event.max_capacity) * 100)
      : null;

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
                  <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-manso-blue/30 border border-manso-blue/40 rounded-full text-blue-300 flex-shrink-0">
                    Privado
                  </span>
                )}
                {event.is_active && (
                  <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 flex-shrink-0">
                    En curso
                  </span>
                )}
              </div>
              <p className="text-[9px] text-manso-cream/40">
                {formatDate(event.start_date)}
                {capacity !== null && ` · ${capacity}% capacidad`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-manso-cream/40">
              <Users size={11} />
              <span className="text-[10px] font-black">{event.registrations_count}</span>
            </div>
            <div className="flex items-center gap-1.5 text-manso-cream/40">
              <Ticket size={11} />
              <span className="text-[10px] font-black">{event.ticket_sales_count}</span>
            </div>
            <ChevronDown size={13} className={`text-manso-cream/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isExpanded && (
          <EventDetail eventId={event.id} onClose={() => setExpanded(null)} />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Próximas fechas */}
      {proximos.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-manso-cream/40 px-1">
            Próximas fechas · {proximos.length}
          </p>
          {proximos.map(renderEvent)}
        </div>
      )}

      {/* Pasados */}
      {pasados.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-manso-cream/20 px-1">
            Pasados · {pasados.length}
          </p>
          {pasados.map(renderEvent)}
        </div>
      )}

      {events.length === 0 && (
        <div className="text-center py-10">
          <Calendar size={32} className="text-manso-cream/20 mx-auto mb-3" />
          <p className="text-sm text-manso-cream/30">Sin eventos en Gestión</p>
        </div>
      )}
    </div>
  );
}
