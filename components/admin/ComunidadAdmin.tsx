'use client';

import { useState } from 'react';
import { Users, Crown, Mail, BarChart2, Shield, Tag } from 'lucide-react';
import { UsuariosList } from './UsuariosList';
import { MembresiaActivasList } from './MembresiaActivasList';
import { ModeracionForo } from './ModeracionForo';
import { ForoCategoriasAdmin } from './ForoCategoriasAdmin';
import { ActividadForo } from './ActividadForo';

type SubTab = 'usuarios' | 'membresias' | 'comunicacion' | 'actividad' | 'moderacion' | 'categorias-foro';

const SUBTABS: { id: SubTab; label: string; icon: React.ReactNode }[] = [
  { id: 'usuarios',        label: 'Usuarios',        icon: <Users size={13} /> },
  { id: 'membresias',      label: 'Membresías',      icon: <Crown size={13} /> },
  { id: 'comunicacion',    label: 'Comunicación',    icon: <Mail size={13} /> },
  { id: 'actividad',       label: 'Actividad',       icon: <BarChart2 size={13} /> },
  { id: 'moderacion',      label: 'Moderación',      icon: <Shield size={13} /> },
  { id: 'categorias-foro', label: 'Categorías Foro', icon: <Tag size={13} /> },
];

function Placeholder({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="bg-manso-cream/5 border border-manso-cream/10 rounded-[2rem] p-12 text-center">
      <div className="text-manso-cream/20 flex justify-center mb-4">{icon}</div>
      <h3 className="text-sm font-black uppercase tracking-tighter text-manso-cream mb-2">{label}</h3>
      <p className="text-xs text-manso-cream/40">Próximamente</p>
    </div>
  );
}

export function ComunidadAdmin() {
  const [subTab, setSubTab] = useState<SubTab>('usuarios');

  return (
    <div>
      {/* Sub-navegación */}
      <div className="flex flex-wrap gap-1 mb-8 bg-manso-cream/5 p-1 rounded-2xl w-full">
        {SUBTABS.map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              subTab === t.id
                ? 'bg-manso-cream text-manso-black shadow-sm'
                : 'text-manso-cream/50 hover:text-manso-cream'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Contenido */}
      {subTab === 'usuarios' && <UsuariosList />}

      {subTab === 'membresias' && (
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-manso-cream/50 mb-6">
            Membresías activas
          </h2>
          <MembresiaActivasList />
        </div>
      )}

      {subTab === 'comunicacion' && (
        <Placeholder
          label="Comunicación"
          icon={<Mail size={40} />}
        />
      )}

      {subTab === 'actividad' && <ActividadForo />}

      {subTab === 'moderacion' && <ModeracionForo />}

      {subTab === 'categorias-foro' && <ForoCategoriasAdmin />}
    </div>
  );
}
