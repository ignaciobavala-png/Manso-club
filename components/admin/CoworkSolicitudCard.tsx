'use client';

import { Check, X, Clock, Trash2, Mail, Phone } from 'lucide-react';
import { ESTADOS, fechaCorta, type Estado, type Solicitud } from './CoworkTypes';

interface Props {
  solicitud: Solicitud;
  /** Línea de contexto bajo el nombre: la fecha del encuentro o el plan pedido. */
  contexto?: React.ReactNode;
  /** Bloque extra al pie (el estado de cuenta y el botón de otorgar, en membresías). */
  pie?: React.ReactNode;
  onEstado: (id: string, estado: Estado) => void;
  onBorrar: (id: string) => void;
}

export function CoworkSolicitudCard({ solicitud: s, contexto, pie, onEstado, onBorrar }: Props) {
  const estado = ESTADOS.find(e => e.id === s.estado)!;

  return (
    <div className="bg-manso-cream/5 border border-manso-cream/10 rounded-2xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-manso-cream font-medium text-sm">{s.nombre}</p>
          <p className="text-[11px] text-manso-cream/35 mt-0.5">
            {contexto}
            {contexto ? ' · ' : ''}
            {fechaCorta(s.created_at)}
          </p>
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${estado.color}`}>
          {estado.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-manso-cream/55 mb-3">
        <a href={`mailto:${s.email}`} className="flex items-center gap-1.5 hover:text-manso-cream transition-colors">
          <Mail size={12} />{s.email}
        </a>
        <a
          href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-manso-cream transition-colors"
        >
          <Phone size={12} />{s.whatsapp}
        </a>
      </div>

      <div className="space-y-1.5 text-[12.5px] text-manso-cream/70 font-light leading-relaxed">
        <p><span className="text-manso-cream/35">Se dedica a:</span> {s.dedicacion}</p>
        {s.proyecto && <p><span className="text-manso-cream/35">Proyecto:</span> {s.proyecto}</p>}
        {s.busca && <p><span className="text-manso-cream/35">Busca:</span> {s.busca}</p>}
      </div>

      {pie}

      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-manso-cream/10">
        <button
          onClick={() => onEstado(s.id, 'aprobado')}
          disabled={s.estado === 'aprobado'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-500/25 text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-25"
        >
          <Check size={11} />Aprobar
        </button>
        <button
          onClick={() => onEstado(s.id, 'pendiente')}
          disabled={s.estado === 'pendiente'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-yellow-500/25 text-yellow-400 hover:bg-yellow-500/10 transition-colors disabled:opacity-25"
        >
          <Clock size={11} />Pendiente
        </button>
        <button
          onClick={() => onEstado(s.id, 'rechazado')}
          disabled={s.estado === 'rechazado'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-500/25 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-25"
        >
          <X size={11} />Rechazar
        </button>
        <button
          onClick={() => onBorrar(s.id)}
          className="ml-auto text-manso-cream/25 hover:text-red-400 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
