'use client';

import { useState } from 'react';
import { Search, Crown, Music } from 'lucide-react';
import { CRMUser } from './CRMAdmin';
import { UsuarioDrawer } from './UsuarioDrawer';

type FilterId = 'todos' | 'activos' | 'por-vencer' | 'vencidos' | 'sin-membresia' | 'artistas';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'todos',         label: 'Todos' },
  { id: 'activos',       label: 'Activos' },
  { id: 'por-vencer',    label: 'Por vencer' },
  { id: 'vencidos',      label: 'Vencidos' },
  { id: 'sin-membresia', label: 'Sin membresía' },
  { id: 'artistas',      label: 'Artistas' },
];

function diasRestantes(hasta: string | null): number | null {
  if (!hasta) return null;
  return Math.ceil((new Date(hasta).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function membresíaBadge(u: CRMUser) {
  if (!u.membresia_activa) return null;
  const dias = diasRestantes(u.membresia_hasta);
  if (dias === null) return { text: 'Vitalicio', cls: 'text-manso-olive bg-manso-olive/10 border-manso-olive/20' };
  if (dias < 0)      return { text: 'Vencida',   cls: 'text-red-400 bg-red-500/10 border-red-500/20' };
  if (dias <= 7)     return { text: `${dias}d`,   cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
  return { text: u.membresia_tipo ?? 'Activa', cls: 'text-green-400 bg-green-500/10 border-green-500/20' };
}

interface CRMContactosProps {
  users: CRMUser[];
  onRefresh: () => void;
}

export function CRMContactos({ users, onRefresh }: CRMContactosProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterId>('todos');
  const [seleccionado, setSeleccionado] = useState<CRMUser | null>(null);

  const now = new Date();
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const filtered = users
    .filter(u => u.role !== 'admin')
    .filter(u => {
      if (!search) return true;
      const q = search.toLowerCase();
      return u.email.toLowerCase().includes(q) || (u.display_name?.toLowerCase().includes(q) ?? false);
    })
    .filter(u => {
      if (filter === 'todos') return true;
      if (filter === 'activos') return u.membresia_activa && (!u.membresia_hasta || new Date(u.membresia_hasta) > in7days);
      if (filter === 'por-vencer') {
        if (!u.membresia_activa || !u.membresia_hasta) return false;
        const d = new Date(u.membresia_hasta);
        return d > now && d <= in7days;
      }
      if (filter === 'vencidos') return u.membresia_activa && !!u.membresia_hasta && new Date(u.membresia_hasta) < now;
      if (filter === 'sin-membresia') return !u.membresia_activa;
      if (filter === 'artistas') return !!(u.artistas && u.artistas.length > 0);
      return true;
    });

  const inicial = (u: CRMUser) => (u.display_name ?? u.email)[0].toUpperCase();

  return (
    <div className="space-y-4">
      {/* Búsqueda */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-manso-cream/30" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra/50 transition-colors"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
              filter === f.id
                ? 'bg-manso-terra text-white'
                : 'bg-manso-cream/5 border border-manso-cream/10 text-manso-cream/50 hover:text-manso-cream hover:border-manso-cream/30'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Conteo */}
      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-manso-cream/30">
        {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Lista */}
      <div className="space-y-1.5">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-manso-cream/30 text-xs">Sin resultados</div>
        ) : (
          filtered.map(u => {
            const badge = membresíaBadge(u);
            const artista = u.artistas?.[0];
            return (
              <button
                key={u.id}
                onClick={() => setSeleccionado(u)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-manso-cream/5 border border-manso-cream/10 rounded-xl hover:border-manso-cream/30 hover:bg-manso-cream/[0.08] transition-all text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-manso-cream/10 flex items-center justify-center flex-shrink-0 text-[10px] font-black text-manso-cream/60">
                    {inicial(u)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-manso-cream truncate">
                      {u.display_name ?? u.email}
                    </p>
                    {u.display_name && (
                      <p className="text-[10px] text-manso-cream/40 truncate">{u.email}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {artista && (
                    <span className="flex items-center px-1.5 py-0.5 bg-manso-olive/10 border border-manso-olive/20 rounded-full text-manso-olive">
                      <Music size={9} />
                    </span>
                  )}
                  {badge ? (
                    <span className={`px-2 py-0.5 border rounded-full text-[7px] font-black uppercase tracking-widest ${badge.cls}`}>
                      {badge.text}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 border rounded-full text-[7px] font-black uppercase tracking-widest text-manso-cream/20 border-manso-cream/10">
                      Sin plan
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
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
    </div>
  );
}
