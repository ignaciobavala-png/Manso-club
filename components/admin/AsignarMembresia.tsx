'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Crown, UserCheck, UserX } from 'lucide-react';
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

export function AsignarMembresia() {
  const [query, setQuery] = useState('');
  const [todos, setTodos] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [seleccionado, setSeleccionado] = useState<UserProfile | null>(null);

  useEffect(() => {
    cargarTodos();
  }, []);

  const cargarTodos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('user_profiles')
      .select('id, email, role, display_name, avatar_url, telefono, created_at, updated_at, membresia_activa, membresia_hasta, membresia_tipo, permisos_totales')
      .neq('role', 'admin')
      .order('email', { ascending: true });
    setTodos(data ?? []);
    setLoading(false);
  };

  const filtrados = query.trim().length === 0
    ? todos
    : todos.filter(u =>
        u.email.toLowerCase().includes(query.toLowerCase()) ||
        (u.display_name ?? '').toLowerCase().includes(query.toLowerCase())
      );

  const handleUpdated = (updated: UserProfile) => {
    setSeleccionado(updated);
    setTodos(prev => prev.map(u => u.id === updated.id ? updated : u));
  };

  return (
    <div>
      {/* Buscador */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-manso-cream/30" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Filtrar por email o nombre..."
          className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl pl-9 pr-4 py-3 text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra transition-colors"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border border-manso-cream/20 border-t-manso-cream/60 rounded-full animate-spin" />
        )}
      </div>

      {/* Conteo */}
      {!loading && (
        <p className="text-[9px] font-black uppercase tracking-widest text-manso-cream/30 mb-3">
          {filtrados.length} usuario{filtrados.length !== 1 ? 's' : ''}
          {query && ` · "${query}"`}
        </p>
      )}

      {/* Lista */}
      <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
        {filtrados.map(u => {
          const esActiva = u.membresia_activa && (!u.membresia_hasta || new Date(u.membresia_hasta) > new Date());
          return (
            <button
              key={u.id}
              onClick={() => setSeleccionado(u)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-manso-cream/5 border border-manso-cream/10 rounded-xl hover:bg-manso-cream/10 hover:border-manso-cream/20 transition-all text-left group"
            >
              <div className="min-w-0">
                {u.display_name && (
                  <p className="text-sm font-bold text-manso-cream truncate">{u.display_name}</p>
                )}
                <p className={`text-xs truncate ${u.display_name ? 'text-manso-cream/40' : 'text-manso-cream font-medium'}`}>
                  {u.email}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {esActiva ? (
                  <>
                    <span className="text-[8px] font-black uppercase tracking-widest text-manso-terra">
                      {u.membresia_tipo ?? 'activa'}
                    </span>
                    <Crown size={14} className="text-manso-terra" />
                  </>
                ) : (
                  <UserX size={14} className="text-manso-cream/30 group-hover:text-manso-cream/60 transition-colors" />
                )}
              </div>
            </button>
          );
        })}

        {!loading && filtrados.length === 0 && (
          <div className="flex items-center gap-2 py-4 text-manso-cream/30">
            <UserCheck size={14} />
            <span className="text-xs">No se encontraron usuarios</span>
          </div>
        )}
      </div>

      {/* Drawer */}
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
