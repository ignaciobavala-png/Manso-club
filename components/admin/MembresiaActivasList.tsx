'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Crown, AlertTriangle, RefreshCw } from 'lucide-react';
import { UsuarioDrawer } from './UsuarioDrawer';

interface UserProfile {
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
}

function diasRestantes(hasta: string | null): number | null {
  if (!hasta) return null;
  const diff = new Date(hasta).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function estadoColor(dias: number | null): string {
  if (dias === null) return 'text-manso-cream/50';
  if (dias < 0) return 'text-red-400';
  if (dias <= 7) return 'text-yellow-400';
  return 'text-green-400';
}

function estadoBg(dias: number | null): string {
  if (dias === null) return 'bg-manso-cream/10';
  if (dias < 0) return 'bg-red-500/10 border-red-500/20';
  if (dias <= 7) return 'bg-yellow-500/10 border-yellow-500/20';
  return 'bg-manso-cream/5 border-manso-cream/10';
}

export function MembresiaActivasList() {
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [seleccionado, setSeleccionado] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchMiembros();
  }, []);

  const fetchMiembros = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('user_profiles')
      .select('id, email, role, display_name, avatar_url, telefono, created_at, updated_at, membresia_activa, membresia_hasta, membresia_tipo, permisos_totales')
      .eq('membresia_activa', true)
      .order('membresia_hasta', { ascending: true, nullsFirst: false });
    setUsuarios(data ?? []);
    setLoading(false);
  };

  const handleUpdated = (updated: UserProfile) => {
    setSeleccionado(updated);
    setUsuarios(prev => prev.map(u => u.id === updated.id ? updated : u));
  };

  const vencidos = usuarios.filter(u => {
    const dias = diasRestantes(u.membresia_hasta);
    return dias !== null && dias < 0;
  });

  const proximos = usuarios.filter(u => {
    const dias = diasRestantes(u.membresia_hasta);
    return dias !== null && dias >= 0 && dias <= 7;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-manso-terra/30 border-t-manso-terra rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Alertas */}
      {(vencidos.length > 0 || proximos.length > 0) && (
        <div className="space-y-2 mb-6">
          {vencidos.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300">
                <span className="font-black">{vencidos.length}</span> membresía{vencidos.length > 1 ? 's' : ''} vencida{vencidos.length > 1 ? 's' : ''}
              </p>
            </div>
          )}
          {proximos.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0" />
              <p className="text-xs text-yellow-300">
                <span className="font-black">{proximos.length}</span> membresía{proximos.length > 1 ? 's' : ''} vence{proximos.length > 1 ? 'n' : ''} en menos de 7 días
              </p>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-manso-cream/50">
          {usuarios.length} miembro{usuarios.length !== 1 ? 's' : ''} activo{usuarios.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={fetchMiembros}
          className="w-7 h-7 flex items-center justify-center text-manso-cream/30 hover:text-manso-cream transition-colors"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {usuarios.length === 0 ? (
        <div className="text-center py-12 bg-manso-cream/5 border border-manso-cream/10 rounded-2xl">
          <Crown size={32} className="text-manso-cream/20 mx-auto mb-3" />
          <p className="text-sm text-manso-cream/40">Sin miembros activos todavía</p>
        </div>
      ) : (
        <div className="space-y-2">
          {usuarios.map(u => {
            const dias = diasRestantes(u.membresia_hasta);
            return (
              <button
                key={u.id}
                onClick={() => setSeleccionado(u)}
                className={`w-full border rounded-2xl px-4 py-3 flex items-center justify-between gap-3 hover:brightness-125 transition-all text-left ${estadoBg(dias)}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Crown size={14} className="text-manso-terra flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-manso-cream truncate">
                      {u.display_name ?? u.email}
                    </p>
                    {u.display_name && (
                      <p className="text-[10px] text-manso-cream/40 truncate">{u.email}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end flex-shrink-0 gap-1">
                  {u.membresia_tipo && (
                    <span className="text-[8px] font-black uppercase tracking-widest text-manso-cream/40">
                      {u.membresia_tipo}
                    </span>
                  )}
                  <span className={`text-[10px] font-black ${estadoColor(dias)}`}>
                    {dias === null
                      ? 'Vitalicio'
                      : dias < 0
                      ? `Venció hace ${Math.abs(dias)}d`
                      : dias === 0
                      ? 'Vence hoy'
                      : `${dias}d restantes`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {seleccionado && (
        <UsuarioDrawer
          usuario={seleccionado}
          onClose={() => setSeleccionado(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
