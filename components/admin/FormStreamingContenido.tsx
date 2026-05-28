'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ImageUploader } from './ImageUploader';

const inputCls = "w-full p-3 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none text-manso-cream placeholder:text-manso-cream/40 text-sm";
const labelCls = "block text-[10px] font-black uppercase tracking-widest text-manso-cream/50 mb-1";

const TIPOS = ['concierto', 'curso', 'taller'] as const;
type Tipo = (typeof TIPOS)[number];

interface FormData {
  titulo: string;
  slug: string;
  tipo: Tipo;
  descripcion: string;
  thumbnail_url: string;
  youtube_video_id: string;
  duracion_minutos: string;
  precio_individual: string;
  orden: string;
  is_live: boolean;
  activo: boolean;
}

const EMPTY: FormData = {
  titulo: '',
  slug: '',
  tipo: 'concierto',
  descripcion: '',
  thumbnail_url: '',
  youtube_video_id: '',
  duracion_minutos: '',
  precio_individual: '0',
  orden: '0',
  is_live: false,
  activo: true,
};

function toSlug(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function FormStreamingContenido() {
  const [loading, setLoading]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm]         = useState<FormData>(EMPTY);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const item = e.detail;
      setEditingId(item.id);
      setForm({
        titulo:            item.titulo ?? '',
        slug:              item.slug ?? '',
        tipo:              item.tipo ?? 'concierto',
        descripcion:       item.descripcion ?? '',
        thumbnail_url:     item.thumbnail_url ?? '',
        youtube_video_id:  item.youtube_video_id ?? '',
        duracion_minutos:  item.duracion_minutos != null ? String(item.duracion_minutos) : '',
        precio_individual: item.precio_individual != null ? String(item.precio_individual) : '0',
        orden:             item.orden != null ? String(item.orden) : '0',
        is_live:           item.is_live ?? false,
        activo:            item.activo ?? true,
      });
    };
    window.addEventListener('editStreamingContenido', handler as EventListener);
    return () => window.removeEventListener('editStreamingContenido', handler as EventListener);
  }, []);

  const set = (field: keyof FormData, value: string | boolean) =>
    setForm(f => ({ ...f, [field]: value }));

  const reset = () => { setEditingId(null); setForm(EMPTY); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        titulo:            form.titulo.trim(),
        slug:              form.slug.trim() || toSlug(form.titulo),
        tipo:              form.tipo,
        descripcion:       form.descripcion.trim() || null,
        thumbnail_url:     form.thumbnail_url || null,
        youtube_video_id:  form.youtube_video_id.trim() || null,
        duracion_minutos:  form.duracion_minutos ? parseInt(form.duracion_minutos) : null,
        precio_individual: parseFloat(form.precio_individual) || 0,
        orden:             parseInt(form.orden) || 0,
        is_live:           form.is_live,
        activo:            form.activo,
      };

      if (editingId) {
        const { error } = await supabase.from('streaming_contenido').update(payload).eq('id', editingId);
        if (error) throw error;
        alert('Contenido actualizado');
      } else {
        const { error } = await supabase.from('streaming_contenido').insert([payload]);
        if (error) throw error;
        alert('Contenido creado');
      }

      reset();
      window.dispatchEvent(new CustomEvent('dashboardRefresh'));
    } catch (err: any) {
      alert(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-manso-cream/5 p-8 rounded-[2.5rem] border border-manso-cream/10 shadow-xl">
      <h2 className="text-2xl font-black uppercase tracking-tighter text-manso-cream mb-6">
        {editingId ? 'Editar Contenido' : 'Nuevo Contenido'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Título */}
        <div>
          <label className={labelCls}>Título</label>
          <input
            className={inputCls + ' text-lg font-black'}
            placeholder="TÍTULO DEL VIDEO"
            value={form.titulo}
            onChange={e => {
              set('titulo', e.target.value);
              if (!editingId) set('slug', toSlug(e.target.value));
            }}
            required
          />
        </div>

        {/* Slug */}
        <div>
          <label className={labelCls}>Slug (URL)</label>
          <input
            className={inputCls + ' font-mono text-xs'}
            placeholder="mi-concierto-2025"
            value={form.slug}
            onChange={e => set('slug', toSlug(e.target.value))}
          />
        </div>

        {/* Tipo */}
        <div>
          <label className={labelCls}>Tipo</label>
          <div className="flex gap-2">
            {TIPOS.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => set('tipo', t)}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  form.tipo === t
                    ? 'bg-manso-terra text-manso-cream'
                    : 'bg-manso-cream/10 text-manso-cream/60 hover:bg-manso-cream/20'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* YouTube Video ID */}
        <div>
          <label className={labelCls}>YouTube Video ID</label>
          <input
            className={inputCls + ' font-mono text-xs'}
            placeholder="dQw4w9WgXcQ"
            value={form.youtube_video_id}
            onChange={e => set('youtube_video_id', e.target.value.trim())}
          />
          <p className="text-[10px] text-manso-cream/30 mt-1">
            La parte &quot;abc123&quot; de youtube.com/watch?v=abc123. Funciona para videos grabados y streams en vivo.
          </p>
        </div>

        {/* Thumbnail */}
        <div>
          <label className={labelCls}>Thumbnail</label>
          <ImageUploader
            onUpload={url => set('thumbnail_url', url)}
            initialPreview={form.thumbnail_url}
            folder="streaming"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className={labelCls}>Descripción</label>
          <textarea
            className={inputCls + ' resize-none'}
            rows={3}
            placeholder="Descripción del contenido..."
            value={form.descripcion}
            onChange={e => set('descripcion', e.target.value)}
          />
        </div>

        {/* Duración y Precio */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Duración (min)</label>
            <input
              type="number"
              className={inputCls + ' text-center font-mono'}
              placeholder="90"
              value={form.duracion_minutos}
              onChange={e => set('duracion_minutos', e.target.value)}
              min="0"
            />
          </div>
          <div>
            <label className={labelCls}>Precio individual (USD)</label>
            <input
              type="number"
              className={inputCls + ' text-center font-mono'}
              placeholder="0"
              value={form.precio_individual}
              onChange={e => set('precio_individual', e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Orden */}
        <div>
          <label className={labelCls}>Orden</label>
          <input
            type="number"
            className={inputCls + ' w-24 text-center font-mono'}
            value={form.orden}
            onChange={e => set('orden', e.target.value)}
            min="0"
          />
        </div>

        {/* Toggles */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_live}
              onChange={e => set('is_live', e.target.checked)}
              className="w-4 h-4 text-manso-terra bg-manso-cream/20 border-manso-cream/30 rounded focus:ring-manso-terra"
            />
            <span className="text-sm text-manso-cream font-medium">En vivo</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={e => set('activo', e.target.checked)}
              className="w-4 h-4 text-manso-terra bg-manso-cream/20 border-manso-cream/30 rounded focus:ring-manso-terra"
            />
            <span className="text-sm text-manso-cream font-medium">Activo (visible)</span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-2">
          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="flex-1 bg-manso-cream/20 text-manso-cream py-4 rounded-3xl font-black uppercase tracking-widest hover:bg-manso-cream/30 transition-all"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-manso-terra text-manso-cream py-4 rounded-3xl font-black uppercase tracking-widest hover:bg-manso-cream hover:text-manso-black transition-all disabled:opacity-50"
          >
            {loading
              ? (editingId ? 'Actualizando...' : 'Creando...')
              : (editingId ? 'Actualizar' : 'Crear Contenido')}
          </button>
        </div>
      </form>
    </div>
  );
}
