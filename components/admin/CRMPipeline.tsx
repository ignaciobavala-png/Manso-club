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
  icon: React.ReactNode;
  color: string;
  border: string;
  headerBg: string;
  countColor: string;
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
      icon: <UserMinus size={12} />,
      color: 'text-manso-cream/50',
      border: 'border-manso-cream/10',
      headerBg: 'bg-manso-cream/5',
      countColor: 'text-manso-cream/40',
      users: nonAdmin.filter(u => !u.membresia_activa),
    },
    {
      id: 'activos',
      label: 'Activos',
      icon: <Crown size={12} />,
      color: 'text-green-400',
      border: 'border-green-500/20',
      headerBg: 'bg-green-500/5',
      countColor: 'text-green-400',
      users: nonAdmin.filter(u =>
        u.membresia_activa && (!u.membresia_hasta || new Date(u.membresia_hasta) > in7days)
      ),
    },
    {
      id: 'por-vencer',
      label: 'Por vencer',
      icon: <AlertTriangle size={12} />,
      color: 'text-yellow-400',
      border: 'border-yellow-500/20',
      headerBg: 'bg-yellow-500/5',
      countColor: 'text-yellow-400',
      users: nonAdmin.filter(u => {
        if (!u.membresia_activa || !u.membresia_hasta) return false;
        const d = new Date(u.membresia_hasta);
        return d > now && d <= in7days;
      }),
    },
    {
      id: 'vencidos',
      label: 'Vencidos',
      icon: <XCircle size={12} />,
      color: 'text-red-400',
      border: 'border-red-500/20',
      headerBg: 'bg-red-500/5',
      countColor: 'text-red-400',
      users: nonAdmin.filter(u =>
        u.membresia_activa && !!u.membresia_hasta && new Date(u.membresia_hasta) < now
      ),
    },
  ];

  const inicial = (u: CRMUser) => (u.display_name ?? u.email)[0].toUpperCase();

  return (
    <>
      {/* Columnas side-by-side */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
        {stages.map(stage => (
          <div key={stage.id} className={`border ${stage.border} rounded-2xl overflow-hidden flex flex-col`}>
            {/* Header */}
            <div className={`${stage.headerBg} px-3 py-3 border-b ${stage.border}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={stage.color}>{stage.icon}</span>
                <span className={`text-2xl font-black leading-none ${stage.countColor}`}>
                  {stage.users.length}
                </span>
              </div>
              <p className={`text-[9px] font-black uppercase tracking-widest ${stage.color}`}>
                {stage.label}
              </p>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto max-h-64 p-1.5 space-y-0.5">
              {stage.users.length === 0 && (
                <p className="text-[8px] text-manso-cream/20 text-center py-4 uppercase tracking-widest">
                  Vacío
                </p>
              )}
              {stage.users.map(u => (
                <button
                  key={u.id}
                  onClick={() => setSeleccionado(u)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-manso-cream/10 transition-colors text-left"
                >
                  <div className="w-5 h-5 rounded-full bg-manso-cream/10 flex items-center justify-center flex-shrink-0 text-[8px] font-black text-manso-cream/50">
                    {inicial(u)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-manso-cream truncate leading-tight">
                      {u.display_name ?? u.email.split('@')[0]}
                    </p>
                    {u.membresia_hasta && (
                      <p className="text-[8px] text-manso-cream/30 leading-tight">
                        {new Date(u.membresia_hasta).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                    {!u.membresia_hasta && u.membresia_activa && (
                      <p className="text-[8px] text-manso-olive/60 leading-tight">Vitalicio</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

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
    </>
  );
}
