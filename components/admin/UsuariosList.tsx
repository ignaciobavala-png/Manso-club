'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Search, Crown, User } from 'lucide-react';
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
}

function getNivel(u: UserProfile) {
  if (u.role === 'admin') return 'admin';
  if (u.membresia_activa && (!u.membresia_hasta || new Date(u.membresia_hasta) > new Date())) return 'miembro';
  return 'registrado';
}

const NIVEL_BADGE: Record<string, string> = {
  admin:      'bg-manso-blue/30 text-blue-300',
  miembro:    'bg-manso-terra/20 text-manso-terra',
  registrado: 'bg-manso-cream/10 text-manso-cream/50',
};

const NIVEL_LABEL: Record<string, string> = {
  admin:      'Admin',
  miembro:    'Miembro',
  registrado: 'Registrado',
};

export function UsuariosList() {
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('user_profiles')
      .select('id, email, role, display_name, avatar_url, telefono, created_at, updated_at, membresia_activa, membresia_hasta, membresia_tipo')
      .order('email', { ascending: true });
    setUsuarios(data ?? []);
    setLoading(false);
  };

  const handleUpdated = (updated: UserProfile) => {
    setUsuarios(prev => prev.map(u => u.id === updated.id ? updated : u));
    setSeleccionado(updated);
  };

  const filtrados = usuarios.filter(u =>
    u.email.toLowerCase().includes(busqueda.toLowerCase()) ||
    (u.display_name ?? '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const total = usuarios.length;
  const miembros = usuarios.filter(u => getNivel(u) === 'miembro').length;
  const registrados = usuarios.filter(u => getNivel(u) === 'registrado').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-manso-terra/30 border-t-manso-terra rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Métricas rápidas */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total', value: total, color: 'text-manso-cream' },
          { label: 'Miembros', value: miembros, color: 'text-manso-terra' },
          { label: 'Registrados', value: registrados, color: 'text-manso-cream/50' },
        ].map(m => (
          <div key={m.label} className="bg-manso-cream/5 border border-manso-cream/10 rounded-2xl p-4 text-center">
            <p className={`text-2xl font-black ${m.color}`}>{m.value}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40 mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-manso-cream/30" />
        <input
          type="text"
          placeholder="Buscar por email o nombre..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra"
        />
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className="text-center py-12">
          <Users size={32} className="text-manso-cream/20 mx-auto mb-3" />
          <p className="text-sm text-manso-cream/40">Sin resultados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map(u => {
            const nivel = getNivel(u);
            const vencida = u.membresia_activa && u.membresia_hasta && new Date(u.membresia_hasta) < new Date();
            return (
              <button
                key={u.id}
                onClick={() => setSeleccionado(u)}
                className="w-full bg-manso-cream/5 border border-manso-cream/10 hover:border-manso-cream/25 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 transition-all text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-manso-cream/10 flex-shrink-0 overflow-hidden">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {nivel === 'miembro'
                          ? <Crown size={14} className="text-manso-terra" />
                          : <User size={14} className="text-manso-cream/40" />}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-manso-cream truncate">
                      {u.display_name ?? u.email}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {u.display_name && (
                        <p className="text-[10px] text-manso-cream/40 truncate">{u.email}</p>
                      )}
                      {u.telefono && (
                        <p className="text-[10px] text-manso-cream/30 truncate">{u.telefono}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {vencida && (
                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-red-500/20 text-red-400">
                      Vencida
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${NIVEL_BADGE[nivel]}`}>
                    {NIVEL_LABEL[nivel]}
                  </span>
                  <span className="text-[9px] text-manso-cream/30">
                    {new Date(u.created_at).toLocaleDateString('es-AR')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Drawer */}
      {seleccionado && (
        <UsuarioDrawer
          usuario={seleccionado}
          onClose={() => setSeleccionado(null)}
          onUpdated={handleUpdated}
        />
      )}
    </>
  );
}
