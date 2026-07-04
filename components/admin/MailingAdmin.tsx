'use client';

import { useState } from 'react';
import { ChevronDown, Send, Users } from 'lucide-react';
import { FormMailingCampania } from './FormMailingCampania';
import { MailingCampaniasList } from './MailingCampaniasList';
import { AudienciasList } from './AudienciasList';

type SectionId = 'campanias' | 'audiencias';

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: 'campanias', label: 'Campañas', icon: <Send size={14} /> },
  { id: 'audiencias', label: 'Audiencias', icon: <Users size={14} /> },
];

export function MailingAdmin() {
  const [open, setOpen] = useState<Set<SectionId>>(new Set(['campanias']));
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const toggle = (id: SectionId) => {
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {SECTIONS.map((section) => {
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
              <ChevronDown size={14} className={`text-manso-cream/30 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 border-t border-manso-cream/10 pt-5">
                {section.id === 'campanias' && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <FormMailingCampania onSaved={() => setRefreshTrigger((n) => n + 1)} />
                    <MailingCampaniasList refreshTrigger={refreshTrigger} />
                  </div>
                )}
                {section.id === 'audiencias' && <AudienciasList />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
