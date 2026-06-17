import { NextResponse } from 'next/server';

interface GestionEventRaw {
  id: string;
  name: string;
  is_paid: boolean;
  ticket_alias_pago: string | null;
}

interface EventSummary {
  eventId: string;
  name: string;
  alias: string | null;
  ticketSalesRevenue: number;
  verifiedRegistrationsRevenue: number;
  total: number;
  ticketsCount: number;
}

export async function GET() {
  const headers = { 'x-crm-secret': process.env.GESTION_CRM_SECRET! };
  const base = process.env.GESTION_API_URL;

  try {
    const eventsRes = await fetch(`${base}/api/crm/events`, {
      headers,
      next: { revalidate: 60 },
    });
    if (!eventsRes.ok) return NextResponse.json({ mansoTotal: 0, tercerosTotal: 0, byEvent: [] });

    const { events } = await eventsRes.json();
    const paidEvents = (events as GestionEventRaw[]).filter(e => e.is_paid);

    const byEvent: EventSummary[] = await Promise.all(
      paidEvents.map(async (event) => {
        try {
          const [revenueRes, registrationsRes] = await Promise.all([
            fetch(`${base}/api/crm/events/${event.id}/revenue`, { headers, next: { revalidate: 60 } }),
            fetch(`${base}/api/crm/events/${event.id}/registrations`, { headers, next: { revalidate: 60 } }),
          ]);

          const revenueData = revenueRes.ok ? await revenueRes.json() : null;
          const registrationsData = registrationsRes.ok ? await registrationsRes.json() : null;

          // Histórico: ticket_sales cargados manualmente
          const ticketSalesRevenue: number = revenueData?.totals?.tickets_revenue ?? 0;
          const ticketsCount: number = revenueData?.totals?.tickets_count ?? 0;

          // Nuevo sistema: registraciones verificadas con price_per_ticket
          const verifiedRegistrationsRevenue: number = (registrationsData?.registrations ?? [])
            .filter((r: { payment_verified: boolean; price_per_ticket: number | null; is_banned: boolean }) =>
              !r.is_banned && r.payment_verified && r.price_per_ticket != null
            )
            .reduce((sum: number, r: { price_per_ticket: number }) => sum + r.price_per_ticket, 0);

          // Si hay datos del nuevo sistema, usarlos. Si no, usar ticket_sales histórico.
          const total = verifiedRegistrationsRevenue > 0
            ? verifiedRegistrationsRevenue
            : ticketSalesRevenue;

          return {
            eventId: event.id,
            name: event.name,
            alias: event.ticket_alias_pago,
            ticketSalesRevenue,
            verifiedRegistrationsRevenue,
            total,
            ticketsCount,
          };
        } catch {
          return {
            eventId: event.id,
            name: event.name,
            alias: event.ticket_alias_pago,
            ticketSalesRevenue: 0,
            verifiedRegistrationsRevenue: 0,
            total: 0,
            ticketsCount: 0,
          };
        }
      })
    );

    // Solo eventos propios de Manso (alias === null)
    const mansoTotal = byEvent
      .filter(e => e.alias === null)
      .reduce((s, e) => s + e.total, 0);

    // Revenue de terceros (informativo)
    const tercerosTotal = byEvent
      .filter(e => e.alias !== null)
      .reduce((s, e) => s + e.total, 0);

    return NextResponse.json({ mansoTotal, tercerosTotal, byEvent });
  } catch {
    return NextResponse.json({ mansoTotal: 0, tercerosTotal: 0, byEvent: [] });
  }
}
