'use client';

import { useEffect, useState } from 'react';
import { Users, Crown, AlertTriangle, XCircle, UserMinus, Music, ShoppingBag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CRMUser } from './CRMAdmin';

interface CRMResumenProps {
  users: CRMUser[];
}

interface StatCard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  sub?: string;
}

export function CRMResumen({ users }: CRMResumenProps) {
  const [pedidosMes, setPedidosMes] = useState<number | null>(null);

  useEffect(() => {
    const desde = new Date();
    desde.setDate(1);
    desde.setHours(0, 0, 0, 0);
    supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', desde.toISOString())
      .then(({ count }) => setPedidosMes(count ?? 0));
  }, []);

  const now = new Date();
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const hace30dias = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

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

  const sinMembresia = nonAdmin.filter(u => !u.membresia_activa).length;
  const artistas = users.filter(u => u.artistas && u.artistas.length > 0).length;
  const nuevos30d = nonAdmin.filter(u => new Date(u.created_at) >= hace30dias).length;

  const stats: StatCard[] = [
    {
      label: 'Total usuarios',
      value: nonAdmin.length,
      icon: <Users size={18} />,
      color: 'text-manso-cream',
      bg: 'bg-manso-cream/5',
      border: 'border-manso-cream/10',
      sub: `+${nuevos30d} últimos 30d`,
    },
    {
      label: 'Miembros activos',
      value: activos,
      icon: <Crown size={18} />,
      color: 'text-green-400',
      bg: 'bg-green-500/5',
      border: 'border-green-500/20',
      sub: nonAdmin.length > 0 ? `${Math.round((activos / nonAdmin.length) * 100)}% conversión` : undefined,
    },
    {
      label: 'Vencen esta semana',
      value: porVencer,
      icon: <AlertTriangle size={18} />,
      color: porVencer > 0 ? 'text-yellow-400' : 'text-manso-cream/30',
      bg: porVencer > 0 ? 'bg-yellow-500/5' : 'bg-manso-cream/5',
      border: porVencer > 0 ? 'border-yellow-500/20' : 'border-manso-cream/10',
      sub: porVencer > 0 ? 'Acción urgente' : 'Sin vencimientos',
    },
    {
      label: 'Membresías vencidas',
      value: vencidos,
      icon: <XCircle size={18} />,
      color: vencidos > 0 ? 'text-red-400' : 'text-manso-cream/30',
      bg: vencidos > 0 ? 'bg-red-500/5' : 'bg-manso-cream/5',
      border: vencidos > 0 ? 'border-red-500/20' : 'border-manso-cream/10',
      sub: vencidos > 0 ? 'Para reactivar' : undefined,
    },
    {
      label: 'Sin membresía',
      value: sinMembresia,
      icon: <UserMinus size={18} />,
      color: 'text-manso-cream/50',
      bg: 'bg-manso-cream/5',
      border: 'border-manso-cream/10',
      sub: 'Leads fríos',
    },
    {
      label: 'Artistas',
      value: artistas,
      icon: <Music size={18} />,
      color: 'text-manso-olive',
      bg: 'bg-manso-olive/5',
      border: 'border-manso-olive/20',
    },
    {
      label: 'Pedidos este mes',
      value: pedidosMes ?? '—',
      icon: <ShoppingBag size={18} />,
      color: 'text-manso-terra',
      bg: 'bg-manso-terra/5',
      border: 'border-manso-terra/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {stats.map(stat => (
        <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-2xl p-4 flex flex-col gap-2`}>
          <span className={`${stat.color} opacity-60`}>{stat.icon}</span>
          <p className={`text-3xl font-black leading-none ${stat.color}`}>{stat.value}</p>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40">{stat.label}</p>
            {stat.sub && (
              <p className={`text-[8px] uppercase tracking-widest mt-0.5 ${stat.color} opacity-60`}>{stat.sub}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
