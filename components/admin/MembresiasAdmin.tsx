'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Crown, Users, UserCheck, FileText, Image, Plus, X } from 'lucide-react';
import { MembresiasList } from './MembresiasList';
import { MembresiaActivasList } from './MembresiaActivasList';
import { AsignarMembresia } from './AsignarMembresia';
import { FormMembresiaTexto } from './FormMembresiaTexto';
import { FormMembresiaGallery } from './FormMembresiaGallery';
import { MembresiaGalleryList } from './MembresiaGalleryList';
import { FormMembresia } from './FormMembresia';

interface MembresiasAdminProps {
  refreshTrigger?: number;
}

type SectionId = 'planes' | 'activos' | 'otorgar' | 'texto' | 'galeria';

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: 'planes',  label: 'Planes de membresía', icon: <Crown size={14} /> },
  { id: 'activos', label: 'Miembros activos',     icon: <Users size={14} /> },
  { id: 'otorgar', label: 'Otorgar membresía',    icon: <UserCheck size={14} /> },
  { id: 'texto',   label: 'Texto intro',           icon: <FileText size={14} /> },
  { id: 'galeria', label: 'Galería cowork',        icon: <Image size={14} /> },
];

export function MembresiasAdmin({ refreshTrigger }: MembresiasAdminProps) {
  const [open, setOpen] = useState<Set<SectionId>>(new Set(['planes']));
  const [showFormMembresia, setShowFormMembresia] = useState(false);

  // Auto-abrir el form cuando se dispara edición desde la lista
  useEffect(() => {
    const handleEdit = () => {
      setShowFormMembresia(true);
      setOpen(prev => new Set(prev).add('planes'));
    };
    window.addEventListener('editMembresia', handleEdit);
    return () => window.removeEventListener('editMembresia', handleEdit);
  }, []);

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
            {/* Header */}
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

            {/* Content */}
            {isOpen && (
              <div className="px-5 pb-5 border-t border-manso-cream/10 pt-5">
                {section.id === 'planes' && (
                  <div className="space-y-4">
                    <MembresiasList refreshTrigger={refreshTrigger} />

                    {!showFormMembresia ? (
                      <button
                        onClick={() => setShowFormMembresia(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-manso-terra/30 rounded-2xl text-[9px] font-black uppercase tracking-widest text-manso-terra/60 hover:text-manso-terra hover:border-manso-terra/60 hover:bg-manso-terra/5 transition-all"
                      >
                        <Plus size={12} />
                        Nueva membresía
                      </button>
                    ) : (
                      <div className="relative">
                        <button
                          onClick={() => setShowFormMembresia(false)}
                          className="absolute top-4 right-4 z-10 w-6 h-6 flex items-center justify-center text-manso-cream/30 hover:text-manso-cream transition-colors"
                        >
                          <X size={13} />
                        </button>
                        <FormMembresia />
                      </div>
                    )}
                  </div>
                )}
                {section.id === 'activos' && <MembresiaActivasList />}
                {section.id === 'otorgar' && <AsignarMembresia />}
                {section.id === 'texto'   && <FormMembresiaTexto />}
                {section.id === 'galeria' && (
                  <div className="space-y-6">
                    <FormMembresiaGallery />
                    <div className="border-t border-manso-cream/10 pt-6">
                      <MembresiaGalleryList refreshTrigger={refreshTrigger} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
