'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Youtube } from 'lucide-react';

const inputCls = "w-full p-3 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none text-manso-cream placeholder:text-manso-cream/40 text-sm";
const labelCls = "block text-[10px] font-black uppercase tracking-widest text-manso-cream/50 mb-1";

const INITIAL = { titulo: '', youtube_url: '', descripcion: '' };

export function FormMultimedia() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(INITIAL);

  const set = (field: keyof typeof INITIAL, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: max } = await supabase
      .from('multimedia_videos')
      .select('orden')
      .order('orden', { ascending: false })
      .limit(1);

    const orden = (max?.[0]?.orden || 0) + 1;

    const { error } = await supabase
      .from('multimedia_videos')
      .insert({ ...form, orden, active: true });

    if (error) {
      alert(error.message);
    } else {
      alert('¡Video agregado!');
      setForm(INITIAL);
      window.dispatchEvent(new CustomEvent('dashboardRefresh'));
    }
    setLoading(false);
  };

  return (
    <div className="bg-manso-cream/5 p-6 rounded-[2rem] border border-manso-cream/10 shadow-xl">
      <div className="mb-5">
        <h2 className="text-lg font-black uppercase tracking-tighter text-manso-cream mb-1">
          Nuevo Video
        </h2>
        <p className="text-xs text-manso-cream/50">Agregá un video de YouTube a la sección Multimedia</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Título</label>
          <input type="text" placeholder="Nombre del video o evento" className={inputCls}
            value={form.titulo} onChange={e => set('titulo', e.target.value)} required />
        </div>

        <div>
          <label className={labelCls}>URL de YouTube</label>
          <div className="relative">
            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 text-manso-cream/40" size={16} />
            <input type="url" placeholder="https://youtube.com/watch?v=..." className={`${inputCls} pl-9`}
              value={form.youtube_url} onChange={e => set('youtube_url', e.target.value)} required />
          </div>
        </div>

        <div>
          <label className={labelCls}>Descripción (opcional)</label>
          <textarea rows={2} placeholder="Contexto del video..." className={`${inputCls} resize-none`}
            value={form.descripcion} onChange={e => set('descripcion', e.target.value)} />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-manso-terra text-manso-cream py-4 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50 text-sm">
          {loading ? 'Agregando...' : 'Agregar Video'}
        </button>
      </form>
    </div>
  );
}
