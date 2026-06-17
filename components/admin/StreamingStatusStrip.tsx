'use client';

import { Wifi, Play, PowerOff, Eye, Users, Lock } from 'lucide-react';

type Modo = 'en_vivo' | 'grabado' | 'apagado';

interface Counts {
  live: number;
  publico: number;
  registrado: number;
  miembro: number;
  total: number;
}

interface StreamingStatusStripProps {
  modo: Modo | null;
  counts: Counts;
  loading: boolean;
}

const MODO_CONFIG = {
  en_vivo: { label: 'En vivo', icon: Wifi,     dot: 'bg-red-500 animate-pulse', card: 'bg-red-500/10 border-red-500/30', text: 'text-red-400' },
  grabado:  { label: 'Grabado', icon: Play,     dot: 'bg-manso-olive',           card: 'bg-manso-olive/10 border-manso-olive/30', text: 'text-manso-olive' },
  apagado:  { label: 'Apagado', icon: PowerOff, dot: 'bg-manso-cream/20',        card: 'bg-manso-cream/5 border-manso-cream/10',  text: 'text-manso-cream/30' },
};

export function StreamingStatusStrip({ modo, counts, loading }: StreamingStatusStripProps) {
  if (loading) return (
    <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex-shrink-0 h-[68px] w-28 bg-manso-cream/5 border border-manso-cream/10 rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  const cfg = modo ? MODO_CONFIG[modo] : MODO_CONFIG.apagado;
  const Icon = cfg.icon;

  return (
    <div className="flex gap-2 mb-5 overflow-x-auto pb-1">

      {/* Canal — siempre visible y prominente */}
      <div className={`flex-shrink-0 rounded-2xl px-4 py-3 min-w-[130px] border ${cfg.card}`}>
        <div className="flex items-center gap-1.5 mb-1">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
          <p className={`text-[8px] font-black uppercase tracking-widest ${cfg.text}`}>Canal</p>
        </div>
        <div className="flex items-center gap-2">
          <Icon size={16} className={cfg.text} />
          <p className={`text-sm font-black ${cfg.text}`}>{cfg.label}</p>
        </div>
      </div>

      {/* Separador */}
      <div className="flex-shrink-0 w-px bg-manso-cream/10 mx-1 self-stretch" />

      {/* En vivo ahora — solo cuando el canal está efectivamente en vivo */}
      {modo === 'en_vivo' && counts.live > 0 && (
        <div className="flex-shrink-0 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 min-w-[100px]">
          <div className="flex items-center gap-1.5 mb-1">
            <Wifi size={10} className="text-red-400" />
            <p className="text-[8px] font-black uppercase tracking-widest text-red-400/70">Live ahora</p>
          </div>
          <p className="text-2xl font-black text-red-400 leading-none">{counts.live}</p>
        </div>
      )}

      {/* Total catálogo */}
      <div className="flex-shrink-0 bg-manso-cream/5 border border-manso-cream/10 rounded-2xl px-4 py-3 min-w-[100px]">
        <div className="flex items-center gap-1.5 mb-1">
          <Play size={10} className="text-manso-cream/40" />
          <p className="text-[8px] font-black uppercase tracking-widest text-manso-cream/30">Total</p>
        </div>
        <p className="text-2xl font-black text-manso-cream leading-none">{counts.total}</p>
        <p className="text-[8px] text-manso-cream/20 mt-0.5">videos</p>
      </div>

      {/* Por audiencia */}
      <div className="flex-shrink-0 bg-manso-cream/5 border border-manso-cream/10 rounded-2xl px-4 py-3 min-w-[110px]">
        <div className="flex items-center gap-1.5 mb-2">
          <Eye size={10} className="text-manso-cream/40" />
          <p className="text-[8px] font-black uppercase tracking-widest text-manso-cream/30">Público</p>
        </div>
        <p className="text-2xl font-black text-manso-cream leading-none">{counts.publico}</p>
      </div>

      <div className="flex-shrink-0 bg-manso-cream/5 border border-manso-cream/10 rounded-2xl px-4 py-3 min-w-[110px]">
        <div className="flex items-center gap-1.5 mb-2">
          <Users size={10} className="text-manso-cream/40" />
          <p className="text-[8px] font-black uppercase tracking-widest text-manso-cream/30">Registrado</p>
        </div>
        <p className="text-2xl font-black text-manso-cream leading-none">{counts.registrado}</p>
      </div>

      <div className="flex-shrink-0 bg-manso-terra/5 border border-manso-terra/20 rounded-2xl px-4 py-3 min-w-[110px]">
        <div className="flex items-center gap-1.5 mb-2">
          <Lock size={10} className="text-manso-terra/70" />
          <p className="text-[8px] font-black uppercase tracking-widest text-manso-terra/50">Miembro</p>
        </div>
        <p className="text-2xl font-black text-manso-terra leading-none">{counts.miembro}</p>
      </div>

    </div>
  );
}
