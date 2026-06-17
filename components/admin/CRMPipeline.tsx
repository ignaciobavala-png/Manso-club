'use client';

import { useState } from 'react';
import { Crown, UserMinus, AlertTriangle, XCircle } from 'lucide-react';
import { CRMUser } from './CRMAdmin';
import { UsuarioDrawer } from './UsuarioDrawer';

interface CRMPipelineProps {
  users: CRMUser[];
  onRefresh: () => void;
}

interface Stage {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  headerBg: string;
  users: CRMUser[];
}

export function CRMPipeline({ users, onRefresh }: CRMPipelineProps) {
  const [seleccionado, setSeleccionado] = useState<CRMUser | null>(null);

  const now = new Date();
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nonAdmin = users.filter(u => u.role !== 'admin');

  const stages: Stage[] = [
    {
      id: 'sin-membresia',
      label: 'Sin membresía',
      description: 'Registrados sin plan — leads fríos',
      icon: <UserMinus size={14} />,
      color: 'text-manso-cream/60',
      bg: 'bg-manso-cream/[0.03]',
      border: 'border-manso-cream/10',
      headerBg: 'bg-manso-cream/5',
      users: nonAdmin.filter(u => !u.membresia_activa),
    },
    {
      id: 'activos',
      label: 'Activos',
      description: 'Plan vigente',
      icon: <Crown size={14} />,
      color: 'text-green-400',
      bg: 'bg-green-500/[0.03]',
      border: 'border-green-500/20',
      headerBg: 'bg-green-500/5',
      users: nonAdmin.filter(u =>
        u.membresia_activa && (!u.membresia_hasta || new Date(u.membresia_hasta) > in7days)
      ),
    },
    {
      id: 'por-vencer',
      label: 'Por vencer',
      description: 'Vencen en ≤7 días',
      icon: <AlertTriangle size={14} />,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/[0.03]',
      border: 'border-yellow-500/20',
      headerBg: 'bg-yellow-500/5',
      users: nonAdmin.filter(u => {
        if (!u.membresia_activa || !u.membresia_hasta) return false;
        const d = new Date(u.membresia_hasta);
        return d > now && d <= in7days;
      }),
    },
    {
      id: 'vencidos',
      label: 'Vencidos',
      description: 'Plan expirado — reactivar',
      icon: <XCircle size={14} />,
      color: 'text-red-400',
      bg: 'bg-red-500/[0.03]',
      border: 'border-red-500/20',
      headerBg: 'bg-red-500/5',
      users: nonAdmin.filter(u =>
        u.membresia_activa && !!u.membresia_hasta && new Date(u.membresia_hasta) < now
      ),
    },
  ];

  const inicial = (u: CRMUser) => (u.display_name ?? u.email)[0].toUpperCase();

  return (
    <div className="space-y-3">
      {stages.map(stage => (
        <div key={stage.id} className={`border ${stage.border} rounded-2xl overflow-hidden`}>
          {/* Header de stage */}
          <div className={`${stage.headerBg} px-5 py-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <span className={stage.color}>{stage.icon}</span>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${stage.color}`}>
                  {stage.label}
                </p>
                <p className="text-[8px] text-manso-cream/30 uppercase tracking-widest mt-0.5">
                  {stage.description}
                </p>
              </div>
            </div>
            <span className={`text-3xl font-black leading-none ${stage.color}`}>
              {stage.users.length}
            </span>
          </div>

          {/* Usuarios de la stage */}
          {stage.users.length > 0 && (
            <div className={`${stage.bg} border-t ${stage.border} px-4 pb-3 pt-2 space-y-0.5 max-h-52 overflow-y-auto`}>
              {stage.users.map(u => (
                <button
                  key={u.id}
                  onClick={() => setSeleccionado(u)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-manso-cream/10 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-manso-cream/10 flex items-center justify-center flex-shrink-0 text-[9px] font-black text-manso-cream/50">
                      {inicial(u)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-manso-cream truncate">{u.display_name ?? u.email}</p>
                      {u.display_name && (
                        <p className="text-[9px] text-manso-cream/30 truncate">{u.email}</p>
                      )}
                    </div>
                  </div>
                  {u.membresia_hasta && (
                    <span className="text-[8px] text-manso-cream/30 flex-shrink-0">
                      {new Date(u.membresia_hasta).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                  {!u.membresia_hasta && u.membresia_activa && (
                    <span className="text-[8px] text-manso-olive/60 flex-shrink-0">Vitalicio</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {seleccionado && (
        <UsuarioDrawer
          usuario={seleccionado as any}
          onClose={() => setSeleccionado(null)}
          onUpdated={updated => {
            setSeleccionado(updated as any);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
