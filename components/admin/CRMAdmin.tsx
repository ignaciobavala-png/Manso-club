'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, BarChart2, Users, GitBranch, Calendar, DollarSign, RefreshCw, FileDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CRMResumen } from './CRMResumen';
import { CRMContactos } from './CRMContactos';
import { CRMPipeline } from './CRMPipeline';
import { CRMEventos } from './CRMEventos';
import { CRMFinanzas } from './CRMFinanzas';
import { CRMKPIStrip } from './CRMKPIStrip';

export interface CRMUser {
  id: string;
  email: string;
  role: 'admin' | 'member';
  display_name: string | null;
  avatar_url: string | null;
  telefono: string | null;
  created_at: string;
  updated_at: string;
  membresia_activa: boolean;
  membresia_hasta: string | null;
  membresia_tipo: string | null;
  permisos_totales: boolean;
  artistas: { id: string; nombre: string; slug: string; active: boolean }[] | null;
}

export interface GestionEvent {
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
  ticket_alias_pago: string | null;
  flyer_url: string | null;
  registrations_count: number;
  ticket_sales_count: number;
}

type SectionId = 'contactos' | 'pipeline' | 'eventos' | 'finanzas';

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: 'contactos', label: 'Contactos',         icon: <Users size={14} /> },
  { id: 'pipeline',  label: 'Estado de miembros', icon: <GitBranch size={14} /> },
  { id: 'eventos',   label: 'Eventos',           icon: <Calendar size={14} /> },
  { id: 'finanzas',  label: 'Finanzas',          icon: <DollarSign size={14} /> },
];

export function CRMAdmin() {
  const [open, setOpen] = useState<Set<SectionId>>(new Set([]));
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [events, setEvents] = useState<GestionEvent[]>([]);
  const [mrr, setMrr] = useState(0);
  const [pedidosMes, setPedidosMes] = useState<{ count: number; total: number }>({ count: 0, total: 0 });
  const [ticketsRevenue, setTicketsRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [
      { data: profilesData },
      { data: artistasData },
      { data: membresiaData },
      eventsRes,
      ticketsRevenueRes,
      { data: pedidosData },
    ] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('id, email, role, display_name, avatar_url, telefono, created_at, updated_at, membresia_activa, membresia_hasta, membresia_tipo, permisos_totales')
        .order('created_at', { ascending: false }),
      supabase
        .from('artistas')
        .select('id, nombre, slug, active, user_id')
        .not('user_id', 'is', null),
      supabase
        .from('user_membresias_activas')
        .select('membresias(precio)')
        .eq('estado', 'activa')
        .or(`vencimiento.is.null,vencimiento.gt.${new Date().toISOString()}`),
      fetch('/api/gestion/events')
        .then(r => r.ok ? r.json() : { events: [] })
        .catch(() => ({ events: [] })),
      fetch('/api/gestion/tickets-revenue')
        .then(r => r.ok ? r.json() : { total: 0 })
        .catch(() => ({ total: 0 })),
      (() => {
        const desde = new Date();
        desde.setDate(1); desde.setHours(0, 0, 0, 0);
        return supabase.from('pedidos').select('total').gte('created_at', desde.toISOString());
      })(),
    ]);

    // Merge artistas
    const artistaMap = new Map<string, { id: string; nombre: string; slug: string; active: boolean }>();
    artistasData?.forEach(a => {
      if (a.user_id) artistaMap.set(a.user_id, { id: a.id, nombre: a.nombre, slug: a.slug, active: a.active });
    });

    setUsers((profilesData ?? []).map(u => ({
      ...u,
      artistas: artistaMap.has(u.id) ? [artistaMap.get(u.id)!] : [],
    })));

    // MRR: suma de precios de membresías activas vigentes
    const mrrTotal = (membresiaData ?? []).reduce((sum, row) => {
      const precio = (row.membresias as unknown as { precio: number } | null)?.precio ?? 0;
      return sum + precio;
    }, 0);
    setMrr(mrrTotal);

    setEvents(eventsRes.events ?? []);
    setTicketsRevenue(ticketsRevenueRes.mansoTotal ?? 0);
    setPedidosMes({
      count: pedidosData?.length ?? 0,
      total: pedidosData?.reduce((s, p) => s + (p.total ?? 0), 0) ?? 0,
    });
    setLastFetch(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const exportarInforme = () => {
    const now = new Date();
    const hace7d  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
    const hace30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const in7d    = new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000);

    const nonAdmin = users.filter(u => u.role !== 'admin');
    const activos    = nonAdmin.filter(u => u.membresia_activa && (!u.membresia_hasta || new Date(u.membresia_hasta) > in7d));
    const porVencer  = nonAdmin.filter(u => u.membresia_activa && u.membresia_hasta && new Date(u.membresia_hasta) > now && new Date(u.membresia_hasta) <= in7d);
    const vencidos   = nonAdmin.filter(u => u.membresia_activa && u.membresia_hasta && new Date(u.membresia_hasta) < now);
    const nuevos7d   = nonAdmin.filter(u => new Date(u.created_at) >= hace7d);
    const nuevos30d  = nonAdmin.filter(u => new Date(u.created_at) >= hace30d);
    const calientes  = nonAdmin.filter(u => !u.membresia_activa && new Date(u.created_at) >= hace30d);
    const frios      = nonAdmin.filter(u => !u.membresia_activa && new Date(u.created_at) < hace30d);
    const proximos   = events.filter(e => new Date(e.start_date) >= now).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    const ars  = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
    const fecha = (d: string) => new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
    const fila  = (label: string, value: string | number, sub = '') =>
      `<tr><td class="label">${label}</td><td class="value">${value}${sub ? `<span class="sub">${sub}</span>` : ''}</td></tr>`;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Informe CRM — Manso Club</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #fff; color: #1D1D1B; padding: 48px; max-width: 900px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #1D1D1B; padding-bottom: 20px; margin-bottom: 40px; }
  .logo { font-size: 32px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; }
  .logo span { color: #BC2915; }
  .meta { text-align: right; font-size: 11px; color: #666; line-height: 1.6; }
  h2 { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.25em; color: #BC2915; margin-bottom: 12px; margin-top: 36px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; vertical-align: top; }
  td.label { color: #666; width: 55%; }
  td.value { font-weight: 700; text-align: right; }
  .sub { display: block; font-weight: 400; font-size: 11px; color: #999; margin-top: 2px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px; }
  .kpi { border: 1px solid #eee; border-radius: 10px; padding: 16px; text-align: center; }
  .kpi .num { font-size: 28px; font-weight: 900; line-height: 1; }
  .kpi .lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 0.15em; color: #999; margin-top: 6px; }
  .kpi.activos .num { color: #16a34a; }
  .kpi.vencer .num  { color: #ca8a04; }
  .kpi.vencidos .num { color: #dc2626; }
  .kpi.mrr .num { color: #868229; }
  .leads { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .lead-box { border: 1px solid #eee; border-radius: 10px; padding: 16px; }
  .lead-box h3 { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: #BC2915; margin-bottom: 10px; }
  .lead-box .count { font-size: 28px; font-weight: 900; margin-bottom: 8px; }
  .lead-box ul { list-style: none; font-size: 11px; color: #666; max-height: 240px; overflow-y: auto; border: 1px solid #f0f0f0; border-radius: 6px; padding: 4px 0; }
  .lead-box ul li { padding: 5px 8px; border-bottom: 1px solid #f5f5f5; user-select: text; }
  .lead-box ul li:last-child { border-bottom: none; }
  .evento { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee; font-size: 13px; }
  .evento .name { font-weight: 700; }
  .evento .info { font-size: 11px; color: #999; margin-top: 2px; }
  .evento .cap { text-align: right; }
  .badge { display: inline-block; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; padding: 2px 6px; border-radius: 4px; background: #f0f0f0; color: #666; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #eee; font-size: 10px; color: #bbb; text-align: center; }
  @media print { body { padding: 24px; } }
</style>
</head>
<body>

<div class="header">
  <div class="logo">MANSO<span>.</span>CLUB</div>
  <div class="meta">
    Informe CRM<br>
    Generado el ${now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}<br>
    a las ${now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
  </div>
</div>

<h2>Membresías activas</h2>
<div class="kpi-grid">
  <div class="kpi mrr"><div class="num">${ars(mrr)}</div><div class="lbl">Ingresos / mes</div></div>
  <div class="kpi activos"><div class="num">${activos.length}</div><div class="lbl">Activos</div></div>
  <div class="kpi vencer"><div class="num">${porVencer.length}</div><div class="lbl">Vencen esta semana</div></div>
  <div class="kpi vencidos"><div class="num">${vencidos.length}</div><div class="lbl">Vencidos</div></div>
</div>

<h2>Crecimiento de usuarios</h2>
<table>
  ${fila('Total de usuarios registrados', nonAdmin.length)}
  ${fila('Nuevos esta semana', `+${nuevos7d.length}`, 'últimos 7 días')}
  ${fila('Nuevos este mes', `+${nuevos30d.length}`, 'últimos 30 días')}
</table>

<h2>Leads — usuarios sin membresía</h2>
<div class="leads">
  <div class="lead-box">
    <h3>🔥 Calientes</h3>
    <div class="count">${calientes.length}</div>
    <p style="font-size:11px;color:#BC2915;margin-bottom:10px;">Registrados hace menos de 30 días</p>
    <ul>${calientes.map(u => `<li>${u.display_name ? `${u.display_name} — ` : ''}${u.email}</li>`).join('')}</ul>
  </div>
  <div class="lead-box">
    <h3>Fríos</h3>
    <div class="count" style="color:#999">${frios.length}</div>
    <p style="font-size:11px;color:#999;margin-bottom:10px;">Registrados hace más de 30 días sin convertir</p>
    <ul>${frios.map(u => `<li>${u.display_name ? `${u.display_name} — ` : ''}${u.email}</li>`).join('')}</ul>
  </div>
</div>

<h2>Ventas en tienda — mes en curso</h2>
<table>
  ${fila('Total facturado', ars(pedidosMes.total), 'suma de todos los pedidos del mes')}
  ${fila('Pedidos recibidos', pedidosMes.count, 'desde el 1ro del mes')}
</table>

<h2>Próximos eventos</h2>
${proximos.length === 0
  ? `<p style="font-size:13px;color:#999;padding:12px 0;">Sin próximos eventos cargados.</p>`
  : proximos.map(e => {
      const ocup = e.max_capacity ? Math.round((e.registrations_count / e.max_capacity) * 100) : null;
      return `<div class="evento">
        <div>
          <div class="name">${e.name}${e.is_private ? ' <span class="badge">Privado</span>' : ''}</div>
          <div class="info">${fecha(e.start_date)}</div>
        </div>
        <div class="cap">
          <div style="font-weight:700">${e.registrations_count} reg.</div>
          <div style="font-size:11px;color:#999">${ocup !== null ? `${ocup}% ocupación` : 'Sin límite'}</div>
        </div>
      </div>`;
    }).join('')
}

<div class="footer">Manso Club · CRM Interno · ${now.getFullYear()}</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    const fechaStr = now.toISOString().slice(0, 10);
    a.href     = url;
    a.download = `informe-crm-manso-${fechaStr}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const toggle = (id: SectionId) => {
    setOpen(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-manso-cream">CRM — Vista del negocio</p>
          {lastFetch && (
            <p className="text-[9px] text-manso-cream/30 mt-0.5">
              Actualizado a las {lastFetch.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportarInforme}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-manso-olive/20 text-manso-olive/60 hover:text-manso-olive hover:border-manso-olive/40 transition-all text-[9px] font-black uppercase tracking-widest disabled:opacity-40"
          >
            <FileDown size={11} />
            Exportar
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-manso-cream/10 text-manso-cream/40 hover:text-manso-cream hover:border-manso-cream/30 transition-all text-[9px] font-black uppercase tracking-widest disabled:opacity-40"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      {/* KPI Strip — siempre visible */}
      <CRMKPIStrip users={users} events={events} mrr={mrr} ticketsRevenue={ticketsRevenue} loading={loading} />

      {/* Resumen — siempre visible, no colapsable */}
      <div className="bg-manso-cream/5 border border-manso-cream/10 rounded-2xl px-5 py-5">
        <div className="flex items-center gap-3 mb-5">
          <BarChart2 size={14} className="text-manso-cream/40" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-manso-cream">Resumen</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-manso-terra/30 border-t-manso-terra rounded-full animate-spin" />
          </div>
        ) : (
          <CRMResumen users={users} />
        )}
      </div>

      {/* Acordeones */}
      {SECTIONS.map(section => {
        const isOpen = open.has(section.id);
        return (
          <div key={section.id} className="bg-manso-cream/5 border border-manso-cream/10 rounded-2xl overflow-hidden">
            <button
              onClick={() => toggle(section.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-manso-cream/5 transition-colors"
            >
              <div className="flex items-center gap-3 text-manso-cream">
                <span className="text-manso-cream/40">{section.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{section.label}</span>
              </div>
              <ChevronDown
                size={14}
                className={`text-manso-cream/30 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 border-t border-manso-cream/10 pt-5">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-manso-terra/30 border-t-manso-terra rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {section.id === 'contactos' && <CRMContactos users={users} onRefresh={fetchData} />}
                    {section.id === 'pipeline'  && <CRMPipeline users={users} onRefresh={fetchData} />}
                    {section.id === 'eventos'   && <CRMEventos events={events} />}
                    {section.id === 'finanzas'  && <CRMFinanzas events={events} />}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
