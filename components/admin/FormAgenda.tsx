'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AgendaEvent {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  duracion: string;
  frecuencia: string;
  precio: number | string;
  activo: boolean;
  cupos_maximos?: number | string;
  whatsapp_contacto?: string;
  luma_url?: string;
}

const INITIAL = {
  titulo: '',
  descripcion: '',
  categoria: 'Taller',
  duracion: '2 horas',
  frecuencia: 'Mensual',
  precio: '0',
  cupos_maximos: '0',
  whatsapp_contacto: '',
  luma_url: '',
};

const categorias  = ['Taller', 'Curso', 'Sesión', 'Clase', 'Evento Recurrente'];
const duraciones  = ['1 hora', '2 horas', '3 horas', '4 horas', 'Medio día', 'Día completo'];
const frecuencias = ['Semanal', 'Quincenal', 'Mensual', 'Bimensual', 'Trimestral'];

const inputCls = "w-full p-3 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none text-manso-cream placeholder:text-manso-cream/40 text-sm";
const labelCls = "block text-[10px] font-black uppercase tracking-widest text-manso-cream/50 mb-1";

export function FormAgenda() {
  const [loading, setLoading]     = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData]   = useState(INITIAL);

  useEffect(() => {
    const handle = (e: CustomEvent) => {
      const ev: AgendaEvent = e.detail;
      setEditingId(ev.id);
      setFormData({
        titulo:            ev.titulo,
        descripcion:       ev.descripcion,
        categoria:         ev.categoria,
        duracion:          ev.duracion,
        frecuencia:        ev.frecuencia,
        precio:            ev.precio.toString(),
        cupos_maximos:     (ev.cupos_maximos || 0).toString(),
        whatsapp_contacto: ev.whatsapp_contacto || '',
      luma_url:          ev.luma_url || '',
      });
    };
    window.addEventListener('editAgendaEvent', handle as EventListener);
    return () => window.removeEventListener('editAgendaEvent', handle as EventListener);
  }, []);

  const reset = () => { setEditingId(null); setFormData(INITIAL); };

  const set = (field: keyof typeof INITIAL, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      titulo:            formData.titulo,
      descripcion:       formData.descripcion,
      categoria:         formData.categoria,
      duracion:          formData.duracion,
      frecuencia:        formData.frecuencia,
      precio:            parseInt(formData.precio) || 0,
      cupos_maximos:     parseInt(formData.cupos_maximos) || 0,
      whatsapp_contacto: formData.whatsapp_contacto,
      luma_url:          formData.luma_url || null,
      activo:            true,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('agenda').update(payload).eq('id', editingId);
        if (error) throw error;
        alert('¡Evento actualizado correctamente!');
      } else {
        const { error } = await supabase.from('agenda').insert([payload]);
        if (error) throw error;
        alert('¡Evento agregado a la agenda!');
      }

      reset();
      window.dispatchEvent(new CustomEvent('dashboardRefresh'));

      fetch('/api/revalidate-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'agenda' }),
      }).catch(() => {});

    } catch (err: any) {
      alert(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-manso-cream/5 p-8 rounded-[2.5rem] border border-manso-cream/10 shadow-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-manso-cream">
          {editingId ? 'Editar evento' : 'Nuevo evento de agenda'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Título */}
        <div>
          <label className={labelCls}>Título del evento</label>
          <input
            type="text"
            placeholder="Ej: Taller de Diseño Gráfico"
            className={`${inputCls} text-xl font-black`}
            value={formData.titulo}
            onChange={e => set('titulo', e.target.value)}
            required
          />
        </div>

        {/* Descripción */}
        <div>
          <label className={labelCls}>Descripción</label>
          <textarea
            placeholder="Describí el evento, qué se aprende, quién puede participar..."
            rows={3}
            className={`${inputCls} resize-none`}
            value={formData.descripcion}
            onChange={e => set('descripcion', e.target.value)}
            required
          />
        </div>

        {/* Categoría + Frecuencia */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Categoría</label>
            <select className={inputCls} value={formData.categoria} onChange={e => set('categoria', e.target.value)}>
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Frecuencia</label>
            <select className={inputCls} value={formData.frecuencia} onChange={e => set('frecuencia', e.target.value)}>
              {frecuencias.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        {/* Duración + Precio */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Duración</label>
            <select className={inputCls} value={formData.duracion} onChange={e => set('duracion', e.target.value)}>
              {duraciones.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Precio (0 = gratis)</label>
            <input
              type="number"
              placeholder="0"
              className={inputCls}
              value={formData.precio}
              onChange={e => set('precio', e.target.value)}
              min="0"
              step="1"
            />
          </div>
        </div>

        {/* Cupos */}
        <div>
          <label className={labelCls}>Cupos máximos (0 = ilimitado)</label>
          <input
            type="number"
            placeholder="0"
            className={inputCls}
            value={formData.cupos_maximos}
            onChange={e => set('cupos_maximos', e.target.value)}
            min="0"
          />
        </div>

        {/* Link de Luma */}
        <div>
          <label className={labelCls}>Link de Luma (lu.ma/...)</label>
          <input
            type="url"
            placeholder="https://lu.ma/nombre-del-evento"
            className={inputCls}
            value={formData.luma_url}
            onChange={e => set('luma_url', e.target.value)}
          />
          <p className="text-[9px] text-manso-cream/30 mt-1 font-light">
            Si tiene link de Luma, el botón "Inscribirme" irá directo ahí. Si no, irá por WhatsApp.
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-4 pt-2">
          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="flex-1 bg-manso-cream/20 text-manso-cream py-5 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-manso-cream/30 transition-all active:scale-95"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-manso-terra text-manso-cream py-5 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50"
          >
            {loading
              ? (editingId ? 'Guardando...' : 'Agregando...')
              : (editingId ? 'Guardar cambios' : 'Agregar evento')}
          </button>
        </div>
      </form>
    </div>
  );
}
