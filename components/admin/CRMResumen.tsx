'use client';

import { useEffect, useState } from 'react';
import { Users, UserMinus, Flame, ShoppingBag, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CRMUser } from './CRMAdmin';

interface CRMResumenProps {
  users: CRMUser[];
}

export function CRMResumen({ users }: CRMResumenProps) {
  const [pedidosMes, setPedidosMes] = useState<{ count: number; total: number } | null>(null);

  useEffect(() => {
    const desde = new Date();
    desde.setDate(1);
    desde.setHours(0, 0, 0, 0);
    supabase
      .from('pedidos')
      .select('total')
      .gte('created_at', desde.toISOString())
      .then(({ data }) => {
        const count = data?.length ?? 0;
        const total = data?.reduce((s, p) => s + (p.total ?? 0), 0) ?? 0;
        setPedidosMes({ count, total });
      });
  }, []);

  const now = new Date();
  const hace7dias  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
  const hace30dias = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const nonAdmin = users.filter(u => u.role !== 'admin');

  const nuevos7d  = nonAdmin.filter(u => new Date(u.created_at) >= hace7dias).length;
  const nuevos30d = nonAdmin.filter(u => new Date(u.created_at) >= hace30dias).length;

  // Leads calientes: sin membresía, registrados en los últimos 30 días
  const leadsCalientes = nonAdmin.filter(u =>
    !u.membresia_activa && new Date(u.created_at) >= hace30dias
  );

  // Leads fríos: sin membresía, registrados hace más de 30 días
  const leadsFrios = nonAdmin.filter(u =>
    !u.membresia_activa && new Date(u.created_at) < hace30dias
  );

  const formatARS = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-4">

      {/* Crecimiento */}
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-manso-cream/30 mb-3 flex items-center gap-2">
          <TrendingUp size={11} /> Crecimiento de usuarios registrados
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-manso-cream/5 border border-manso-cream/10 rounded-2xl p-4">
            <p className="text-3xl font-black text-manso-cream leading-none">+{nuevos7d}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40 mt-2">Usuarios nuevos esta semana</p>
            <p className="text-[8px] text-manso-cream/20 mt-0.5">Se registraron en los últimos 7 días</p>
          </div>
          <div className="bg-manso-cream/5 border border-manso-cream/10 rounded-2xl p-4">
            <p className="text-3xl font-black text-manso-cream leading-none">+{nuevos30d}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40 mt-2">Usuarios nuevos este mes</p>
            <p className="text-[8px] text-manso-cream/20 mt-0.5">{nonAdmin.length} usuarios en total</p>
          </div>
        </div>
      </div>

      {/* Leads */}
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-manso-cream/30 mb-3 flex items-center gap-2">
          <Users size={11} /> Usuarios registrados sin membresía activa
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-manso-terra/5 border border-manso-terra/20 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Flame size={12} className="text-manso-terra" />
              <p className="text-[8px] font-black uppercase tracking-widest text-manso-terra/70">Leads calientes</p>
            </div>
            <p className="text-3xl font-black text-manso-terra leading-none">{leadsCalientes.length}</p>
            <p className="text-[8px] text-manso-terra/40 mt-1.5">Se registraron hace menos de 30 días — oportunidad de conversión</p>
            {leadsCalientes.length > 0 && (
              <div className="mt-2 space-y-0.5">
                {leadsCalientes.slice(0, 3).map(u => (
                  <p key={u.id} className="text-[8px] text-manso-cream/40 truncate">
                    {u.display_name ?? u.email}
                  </p>
                ))}
                {leadsCalientes.length > 3 && (
                  <p className="text-[8px] text-manso-cream/20">+{leadsCalientes.length - 3} más</p>
                )}
              </div>
            )}
          </div>
          <div className="bg-manso-cream/5 border border-manso-cream/10 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <UserMinus size={12} className="text-manso-cream/40" />
              <p className="text-[8px] font-black uppercase tracking-widest text-manso-cream/30">Leads fríos</p>
            </div>
            <p className="text-3xl font-black text-manso-cream/40 leading-none">{leadsFrios.length}</p>
            <p className="text-[8px] text-manso-cream/20 mt-1.5">Registrados hace más de 30 días sin convertir</p>
          </div>
        </div>
      </div>

      {/* Tienda */}
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-manso-cream/30 mb-3 flex items-center gap-2">
          <ShoppingBag size={11} /> Ventas en tienda — mes en curso
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-manso-terra/5 border border-manso-terra/20 rounded-2xl p-4">
            <p className="text-3xl font-black text-manso-terra leading-none">
              {pedidosMes ? formatARS(pedidosMes.total) : '—'}
            </p>
            <p className="text-[9px] font-black uppercase tracking-widest text-manso-terra/50 mt-2">Total facturado</p>
            <p className="text-[8px] text-manso-terra/30 mt-0.5">Suma de todos los pedidos del mes</p>
          </div>
          <div className="bg-manso-cream/5 border border-manso-cream/10 rounded-2xl p-4">
            <p className="text-3xl font-black text-manso-cream leading-none">
              {pedidosMes?.count ?? '—'}
            </p>
            <p className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40 mt-2">Pedidos recibidos</p>
            <p className="text-[8px] text-manso-cream/20 mt-0.5">Desde el 1ro del mes</p>
          </div>
        </div>
      </div>

    </div>
  );
}
