'use client';

import { useState } from 'react';
import { ChevronDown, Video, Radio, Tag, Plus } from 'lucide-react';
import { StreamingContenidoList } from './StreamingContenidoList';
import { FormStreamingContenido } from './FormStreamingContenido';
import { CanalControl } from './CanalControl';
import { StreamingCategoriasAdmin } from './StreamingCategoriasAdmin';

interface StreamingAdminProps {
  refreshTrigger?: number;
}

type SectionId = 'contenidos' | 'nuevo' | 'canal' | 'categorias';

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: 'contenidos',  label: 'Contenidos',      icon: <Video size={14} /> },
  { id: 'nuevo',       label: 'Nuevo contenido',  icon: <Plus size={14} /> },
  { id: 'canal',       label: 'Control del canal', icon: <Radio size={14} /> },
  { id: 'categorias',  label: 'Categorías',       icon: <Tag size={14} /> },
];

export function StreamingAdmin({ refreshTrigger }: StreamingAdminProps) {
  const [open, setOpen] = useState<Set<SectionId>>(new Set(['contenidos']));

  const toggle = (id: SectionId) => {
    setOpen(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {SECTIONS.map(section => {
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
              <div className="flex items-center gap-3 text-manso-cream">
                <span className="text-manso-cream/40">{section.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                  {section.label}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`text-manso-cream/30 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 border-t border-manso-cream/10 pt-5">
                {section.id === 'contenidos'  && <StreamingContenidoList refreshTrigger={refreshTrigger ?? 0} />}
                {section.id === 'nuevo'       && <FormStreamingContenido />}
                {section.id === 'canal'       && <CanalControl />}
                {section.id === 'categorias'  && <StreamingCategoriasAdmin />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
