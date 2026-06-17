'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Video, Radio, Tag, Plus, Wifi, Play, PowerOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { StreamingContenidoList } from './StreamingContenidoList';
import { FormStreamingContenido } from './FormStreamingContenido';
import { CanalControl } from './CanalControl';
import { StreamingCategoriasAdmin } from './StreamingCategoriasAdmin';
import { StreamingStatusStrip } from './StreamingStatusStrip';

interface StreamingAdminProps {
  refreshTrigger?: number;
}

type Modo = 'en_vivo' | 'grabado' | 'apagado';
type SectionId = 'nuevo' | 'contenidos' | 'canal' | 'categorias';

const MODO_BADGE: Record<Modo, { label: string; icon: React.ReactNode; style: string }> = {
  en_vivo: { label: 'En vivo',  icon: <Wifi size={9} />,      style: 'bg-red-500/10 border-red-500/30 text-red-400' },
  grabado:  { label: 'Grabado', icon: <Play size={9} />,      style: 'bg-manso-olive/10 border-manso-olive/30 text-manso-olive' },
  apagado:  { label: 'Apagado', icon: <PowerOff size={9} />,  style: 'bg-manso-cream/5 border-manso-cream/10 text-manso-cream/30' },
};

export function StreamingAdmin({ refreshTrigger }: StreamingAdminProps) {
  const [open, setOpen] = useState<Set<SectionId>>(new Set(['nuevo']));

  // Estado del canal y conteos para el strip
  const [modo, setModo]       = useState<Modo | null>(null);
  const [counts, setCounts]   = useState({ live: 0, publico: 0, registrado: 0, miembro: 0, total: 0 });
  const [stripLoading, setStripLoading] = useState(true);
  const [totalContenidos, setTotalContenidos] = useState(0);

  const fetchStrip = useCallback(async () => {
    setStripLoading(true);
    const [{ data: cfg }, { data: items }] = await Promise.all([
      supabase.from('streaming_config').select('modo').single(),
      supabase.from('streaming_contenido').select('is_live, visibilidad'),
    ]);

    if (cfg) setModo(cfg.modo as Modo);

    const all = items ?? [];
    const c = {
      live:       all.filter(i => i.is_live).length,
      publico:    all.filter(i => i.visibilidad === 'publico').length,
      registrado: all.filter(i => i.visibilidad === 'registrado').length,
      miembro:    all.filter(i => i.visibilidad === 'miembro').length,
      total:      all.length,
    };
    setCounts(c);
    setTotalContenidos(all.length);
    setStripLoading(false);
  }, []);

  useEffect(() => { fetchStrip(); }, [fetchStrip, refreshTrigger]);

  // Refrescar strip cuando el canal cambia o se crea/edita contenido
  useEffect(() => {
    const handler = () => fetchStrip();
    window.addEventListener('dashboardRefresh', handler);
    return () => window.removeEventListener('dashboardRefresh', handler);
  }, [fetchStrip]);

  const toggle = (id: SectionId) => {
    setOpen(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const sections: {
    id: SectionId;
    label: string;
    icon: React.ReactNode;
    badge?: React.ReactNode;
    desc: string;
  }[] = [
    {
      id: 'nuevo',
      label: 'Nuevo contenido',
      icon: <Plus size={14} />,
      desc: 'Publicar un video grabado o iniciar un live',
    },
    {
      id: 'contenidos',
      label: 'Catálogo',
      icon: <Video size={14} />,
      desc: 'Todos los videos por audiencia',
      badge: totalContenidos > 0 ? (
        <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-manso-cream/10 border border-manso-cream/10 text-manso-cream/40">
          {totalContenidos}
        </span>
      ) : undefined,
    },
    {
      id: 'canal',
      label: 'Control del canal',
      icon: <Radio size={14} />,
      desc: 'Qué ven los usuarios al entrar a /streaming',
      badge: modo ? (
        <span className={`inline-flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-full border ${MODO_BADGE[modo].style}`}>
          {MODO_BADGE[modo].icon}
          {MODO_BADGE[modo].label}
        </span>
      ) : undefined,
    },
    {
      id: 'categorias',
      label: 'Categorías',
      icon: <Tag size={14} />,
      desc: 'Tipos de contenido disponibles',
    },
  ];

  return (
    <div className="space-y-2">

      {/* Strip de estado — siempre visible */}
      <StreamingStatusStrip modo={modo} counts={counts} loading={stripLoading} />

      {/* Acordeones */}
      {sections.map(section => {
        const isOpen = open.has(section.id);
        return (
          <div
            key={section.id}
            className="bg-manso-cream/5 border border-manso-cream/10 rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => toggle(section.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-manso-cream/5 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-manso-cream/40 flex-shrink-0">{section.icon}</span>
                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-manso-cream">
                      {section.label}
                    </span>
                    {section.badge}
                  </div>
                  <p className="text-[8px] text-manso-cream/25 tracking-wide mt-0.5">{section.desc}</p>
                </div>
              </div>
              <ChevronDown
                size={14}
                className={`text-manso-cream/30 transition-transform duration-200 flex-shrink-0 ml-3 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 border-t border-manso-cream/10 pt-5">
                {section.id === 'nuevo'      && <FormStreamingContenido />}
                {section.id === 'contenidos' && <StreamingContenidoList refreshTrigger={refreshTrigger ?? 0} />}
                {section.id === 'canal'      && <CanalControl />}
                {section.id === 'categorias' && <StreamingCategoriasAdmin />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
