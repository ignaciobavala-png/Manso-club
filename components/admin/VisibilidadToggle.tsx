'use client';

import { Globe, Users, Crown } from 'lucide-react';

type Visibilidad = 'publico' | 'registrado' | 'miembro';

interface VisibilidadToggleProps {
  value: Visibilidad;
  onChange: (v: Visibilidad) => void;
}

const OPCIONES: { value: Visibilidad; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'publico',    label: 'Público',    icon: <Globe size={11} />,  desc: 'Todos lo ven' },
  { value: 'registrado', label: 'Registrado', icon: <Users size={11} />,  desc: 'Solo con cuenta' },
  { value: 'miembro',    label: 'Miembro',    icon: <Crown size={11} />,  desc: 'Solo miembros' },
];

export function VisibilidadToggle({ value, onChange }: VisibilidadToggleProps) {
  return (
    <div>
      <span className="block text-[10px] font-black uppercase tracking-widest text-manso-cream/50 mb-2">
        Visibilidad
      </span>
      <div className="flex gap-1.5">
        {OPCIONES.map(op => (
          <button
            key={op.value}
            type="button"
            onClick={() => onChange(op.value)}
            title={op.desc}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex-1 justify-center ${
              value === op.value
                ? op.value === 'publico'
                  ? 'bg-manso-cream text-manso-black'
                  : op.value === 'registrado'
                  ? 'bg-manso-blue/50 text-blue-200'
                  : 'bg-manso-terra text-manso-cream'
                : 'bg-manso-cream/5 text-manso-cream/40 hover:bg-manso-cream/10 border border-manso-cream/10'
            }`}
          >
            {op.icon}
            <span className="hidden sm:inline">{op.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
