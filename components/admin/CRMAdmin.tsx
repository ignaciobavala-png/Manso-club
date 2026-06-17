'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, BarChart2, Users, GitBranch, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CRMResumen } from './CRMResumen';
import { CRMContactos } from './CRMContactos';
import { CRMPipeline } from './CRMPipeline';

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

type SectionId = 'resumen' | 'contactos' | 'pipeline';

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: 'resumen',   label: 'Resumen del negocio', icon: <BarChart2 size={14} /> },
  { id: 'contactos', label: 'Base de contactos',   icon: <Users size={14} /> },
  { id: 'pipeline',  label: 'Pipeline',             icon: <GitBranch size={14} /> },
];

export function CRMAdmin() {
  const [open, setOpen] = useState<Set<SectionId>>(new Set(['resumen']));
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    const [{ data: profilesData }, { data: artistasData }] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('id, email, role, display_name, avatar_url, telefono, created_at, updated_at, membresia_activa, membresia_hasta, membresia_tipo, permisos_totales')
        .order('created_at', { ascending: false }),
      supabase
        .from('artistas')
        .select('id, nombre, slug, active, user_id')
        .not('user_id', 'is', null),
    ]);

    // Indexar artistas por user_id para merge O(1)
    const artistaMap = new Map<string, { id: string; nombre: string; slug: string; active: boolean }>();
    artistasData?.forEach(a => {
      if (a.user_id) artistaMap.set(a.user_id, { id: a.id, nombre: a.nombre, slug: a.slug, active: a.active });
    });

    const merged: CRMUser[] = (profilesData ?? []).map(u => ({
      ...u,
      artistas: artistaMap.has(u.id) ? [artistaMap.get(u.id)!] : [],
    }));

    setUsers(merged);
    setLastFetch(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

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
      <div className="flex items-center justify-between px-1 mb-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-manso-cream">CRM — Vista del negocio</p>
          {lastFetch && (
            <p className="text-[9px] text-manso-cream/30 mt-0.5">
              Actualizado a las {lastFetch.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-manso-cream/10 text-manso-cream/40 hover:text-manso-cream hover:border-manso-cream/30 transition-all text-[9px] font-black uppercase tracking-widest disabled:opacity-40"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

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
                    {section.id === 'resumen'   && <CRMResumen users={users} />}
                    {section.id === 'contactos' && <CRMContactos users={users} onRefresh={fetchUsers} />}
                    {section.id === 'pipeline'  && <CRMPipeline users={users} onRefresh={fetchUsers} />}
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
