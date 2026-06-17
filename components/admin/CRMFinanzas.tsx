'use client';

import { useState, useEffect } from 'react';
import { DollarSign, ChevronDown, X, TrendingUp } from 'lucide-react';
import { GestionEvent } from './CRMAdmin';

interface Revenue {
  ticket_sales: { id: string; guest_name: string; type: string; price: number }[];
  product_sales: { id: string; product_name: string; quantity: number; total: number; payment_method: string }[];
  totals: { tickets_revenue: number; products_revenue: number; total_revenue: number; tickets_count: number };
}

interface Registration {
  id: string;
  name: string;
  email: string;
  payment_verified: boolean;
  price_per_ticket: number | null;
  is_banned: boolean;
}

function formatARS(n: number) {
  return `$${n.toLocaleString('es-AR')}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' });
}

function RevenueDetail({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [verifiedRegs, setVerifiedRegs] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/gestion/events/${eventId}/revenue`).then(r => r.json()),
      fetch(`/api/gestion/events/${eventId}/registrations`).then(r => r.json()),
    ]).then(([revenueData, regsData]) => {
      setRevenue(revenueData);
      const verified = (regsData.registrations ?? []).filter(
        (r: Registration) => r.payment_verified && r.price_per_ticket != null
      );
      setVerifiedRegs(verified);
      setLoading(false);
    });
  }, [eventId]);

  if (loading) return (
    <div className="flex justify-center py-6">
      <div className="w-5 h-5 border-2 border-manso-terra/30 border-t-manso-terra rounded-full animate-spin" />
    </div>
  );

  if (!revenue) return null;

  return (
    <div className="space-y-4">
      {/* Totales */}
      {(() => {
        const verifiedTotal = verifiedRegs.reduce((s, r) => s + (r.price_per_ticket ?? 0), 0);
        const grandTotal = revenue.totals.total_revenue + verifiedTotal;
        return (
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-manso-terra/10 border border-manso-terra/20 rounded-xl p-3 col-span-2">
          <p className="text-2xl font-black text-manso-terra">{formatARS(grandTotal)}</p>
          <p className="text-[8px] uppercase tracking-widest text-manso-terra/50 mt-0.5">Total del evento</p>
        </div>
        <div className="bg-manso-cream/5 border border-manso-cream/10 rounded-xl p-3">
          <p className="text-lg font-black text-manso-cream">{formatARS(revenue.totals.tickets_revenue)}</p>
          <p className="text-[8px] uppercase tracking-widest text-manso-cream/30 mt-0.5">Tickets · {revenue.totals.tickets_count} vendidos</p>
        </div>
        <div className="bg-manso-cream/5 border border-manso-cream/10 rounded-xl p-3">
          <p className="text-lg font-black text-manso-cream">{formatARS(revenue.totals.products_revenue)}</p>
          <p className="text-[8px] uppercase tracking-widest text-manso-cream/30 mt-0.5">Productos</p>
        </div>
      </div>
        );
      })()}

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

      {/* Registraciones verificadas con precio — sistema nuevo */}
      {verifiedRegs.length > 0 && (
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-manso-cream/30 mb-2">
            Registros con pago verificado
            <span className="ml-2 text-green-400/60">· {formatARS(verifiedRegs.reduce((s, r) => s + (r.price_per_ticket ?? 0), 0))}</span>
          </p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {verifiedRegs.map(r => (
              <div key={r.id} className="flex items-center justify-between px-3 py-2 bg-green-500/5 border border-green-500/10 rounded-lg">
                <div>
                  <p className="text-xs text-manso-cream">{r.name}</p>
                  <p className="text-[8px] text-manso-cream/30">{r.email}</p>
                </div>
                <p className="text-xs font-black text-green-400">{formatARS(r.price_per_ticket!)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {revenue.ticket_sales.length === 0 && revenue.product_sales.length === 0 && verifiedRegs.length === 0 && (
        <p className="text-xs text-manso-cream/30 text-center py-4">Sin ventas registradas</p>
      )}
    </div>
  );
}

interface CRMFinanzasProps {
  events: GestionEvent[];
}

export function CRMFinanzas({ events }: CRMFinanzasProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const now = new Date();
  const proximos = events
    .filter(e => new Date(e.start_date) >= now)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  const pasados = events
    .filter(e => new Date(e.start_date) < now)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  const sorted = [...proximos, ...pasados];

  if (events.length === 0) return (
    <div className="text-center py-10">
      <DollarSign size={32} className="text-manso-cream/20 mx-auto mb-3" />
      <p className="text-sm text-manso-cream/30">Sin datos de eventos</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Totales — solo próximos */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-manso-cream/5 border border-manso-cream/10 rounded-2xl p-4">
          <p className="text-2xl font-black text-manso-cream">{proximos.length}</p>
          <p className="text-[8px] uppercase tracking-widest text-manso-cream/30 mt-1">Próximos</p>
        </div>
        <div className="bg-manso-cream/5 border border-manso-cream/10 rounded-2xl p-4">
          <p className="text-2xl font-black text-manso-cream">{proximos.reduce((s, e) => s + e.registrations_count, 0)}</p>
          <p className="text-[8px] uppercase tracking-widest text-manso-cream/30 mt-1">Registraciones</p>
        </div>
        <div className="bg-manso-cream/5 border border-manso-cream/10 rounded-2xl p-4">
          <p className="text-2xl font-black text-manso-cream">{proximos.reduce((s, e) => s + e.ticket_sales_count, 0)}</p>
          <p className="text-[8px] uppercase tracking-widest text-manso-cream/30 mt-1">Tickets puerta</p>
        </div>
      </div>

      <p className="text-xs font-black uppercase tracking-[0.2em] text-manso-cream/40 px-1 flex items-center gap-2">
        <TrendingUp size={13} /> Ingresos por evento — expandir para ver detalle
      </p>

      {/* Lista de eventos con revenue lazy */}
      <div className="space-y-2">
        {sorted.map(event => {
          const isExpanded = expanded === event.id;
          const now = new Date();
          const isPast = new Date(event.start_date) < now;

          return (
            <div key={event.id}>
              <button
                onClick={() => setExpanded(isExpanded ? null : event.id)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl hover:border-manso-cream/30 transition-all text-left border ${
                  event.ticket_alias_pago
                    ? 'bg-manso-cream/3 border-manso-cream/5 opacity-60'
                    : 'bg-manso-cream/5 border-manso-cream/10'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-manso-cream truncate">{event.name}</p>
                  <p className="text-[9px] text-manso-cream/40 mt-0.5">
                    {formatDate(event.start_date)} · {event.ticket_sales_count} tickets vendidos
                  </p>
                  {event.ticket_alias_pago && (
                    <p className="text-[8px] text-manso-cream/30 mt-0.5 uppercase tracking-widest">
                      Recaudó: {event.ticket_alias_pago}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {event.ticket_alias_pago && (
                    <span className="text-[7px] font-black uppercase px-1.5 py-0.5 bg-manso-cream/5 border border-manso-cream/10 rounded-full text-manso-cream/30">
                      Tercero
                    </span>
                  )}
                  {!isPast && !event.ticket_alias_pago && (
                    <span className="text-[7px] font-black uppercase px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-400">
                      Próximo
                    </span>
                  )}
                  <ChevronDown size={13} className={`text-manso-cream/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {isExpanded && (
                <div className="mt-2 bg-manso-black/40 border border-manso-cream/10 rounded-2xl p-4">
                  <div className="flex justify-end mb-3">
                    <button onClick={() => setExpanded(null)} className="text-manso-cream/20 hover:text-manso-cream transition-colors">
                      <X size={13} />
                    </button>
                  </div>
                  <RevenueDetail eventId={event.id} onClose={() => setExpanded(null)} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
