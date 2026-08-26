'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle } from 'lucide-react';

export interface CoworkFecha {
  id: string;
  fecha: string;
  horario: string | null;
  cupos_maximos: number;
  ocupados: number;
}

interface CoworkFormProps {
  origen: 'membresia' | 'open_cowork';
  /** Nombre del plan, cuando la solicitud viene del botón SELECCIONAR de una card. */
  membresiaNombre?: string;
  /** Fecha de Open Cowork elegida en el acordeón. */
  fechaId?: string | null;
  onSuccess?: () => void;
}

const inputCls =
  'w-full bg-transparent border border-manso-cream/25 rounded-lg px-3 py-2.5 text-manso-cream ' +
  'placeholder:text-manso-cream/25 text-sm font-light focus:outline-none focus:border-manso-terra ' +
  'transition-colors';
const labelCls = 'block text-[10px] uppercase tracking-[0.2em] text-manso-cream/45 mb-1.5';

const INITIAL = {
  nombre: '',
  email: '',
  whatsapp: '',
  dedicacion: '',
  proyecto: '',
  busca: '',
};

export function CoworkForm({ origen, membresiaNombre, fechaId, onSuccess }: CoworkFormProps) {
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();

    const { error: dbError } = await supabase.from('cowork_solicitudes').insert({
      origen,
      membresia_nombre: origen === 'membresia' ? membresiaNombre ?? null : null,
      fecha_id: origen === 'open_cowork' ? fechaId ?? null : null,
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      whatsapp: form.whatsapp.trim(),
      dedicacion: form.dedicacion.trim(),
      proyecto: form.proyecto.trim() || null,
      busca: form.busca.trim() || null,
      user_id: user?.id ?? null,
    });

    if (dbError) {
      console.error('Error al enviar la solicitud de cowork:', dbError);
      setError('Hubo un problema al enviar. Intentá de nuevo.');
    } else {
      setEnviado(true);
      onSuccess?.();
    }
    setLoading(false);
  };

  if (enviado) {
    return (
      <div className="py-12 text-center">
        <CheckCircle size={40} strokeWidth={1.4} className="text-manso-terra mx-auto mb-5" />
        <p className="text-manso-cream text-lg font-light mb-2">Recibimos tu solicitud</p>
        <p className="text-manso-cream/45 text-sm font-light leading-relaxed max-w-xs mx-auto">
          Te escribimos por WhatsApp o mail para coordinar. Puede tardar un par de días.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Nombre completo *</label>
          <input
            required
            className={inputCls}
            value={form.nombre}
            onChange={e => set('nombre', e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Mail *</label>
          <input
            required
            type="email"
            className={inputCls}
            value={form.email}
            onChange={e => set('email', e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>WhatsApp *</label>
          <input
            required
            type="tel"
            placeholder="+54 9 11 ..."
            className={inputCls}
            value={form.whatsapp}
            onChange={e => set('whatsapp', e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>¿A qué te dedicás? *</label>
          <input
            required
            className={inputCls}
            value={form.dedicacion}
            onChange={e => set('dedicacion', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Proyecto / empresa</label>
        <input
          className={inputCls}
          value={form.proyecto}
          onChange={e => set('proyecto', e.target.value)}
        />
      </div>

      <div>
        <label className={labelCls}>¿Qué buscás en un espacio de cowork?</label>
        <textarea
          rows={3}
          className={`${inputCls} resize-none`}
          value={form.busca}
          onChange={e => set('busca', e.target.value)}
        />
      </div>

      {error && <p className="text-manso-terra text-xs font-light">{error}</p>}

      <button
        type="submit"
        disabled={loading || (origen === 'open_cowork' && !fechaId)}
        className="w-full min-h-[46px] rounded-full bg-manso-cream text-manso-black text-[10px] font-black uppercase tracking-widest transition-opacity duration-200 hover:opacity-80 active:scale-95 disabled:opacity-30 disabled:active:scale-100"
      >
        {loading
          ? 'Enviando...'
          : origen === 'open_cowork' && !fechaId
            ? 'Elegí una fecha'
            : 'Enviar solicitud'}
      </button>
    </form>
  );
}
