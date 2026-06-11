'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ImageUploader } from './ImageUploader';
import { VisibilidadToggle } from './VisibilidadToggle';
import { ChevronDown, HelpCircle, X, Wifi, Eye } from 'lucide-react';

const inputCls = "w-full p-3 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none text-manso-cream placeholder:text-manso-cream/40 text-sm";
const labelCls = "block text-[10px] font-black uppercase tracking-widest text-manso-cream/50 mb-1";

interface Categoria { slug: string; nombre: string; }

type Visibilidad = 'publico' | 'registrado' | 'miembro';

interface FormData {
  titulo: string;
  slug: string;
  tipo: string;
  descripcion: string;
  thumbnail_url: string;
  youtube_video_id: string;
  duracion_minutos: string;

  orden: string;
  is_live: boolean;
  activo: boolean;
  visibilidad: Visibilidad;
}

const EMPTY: FormData = {
  titulo: '', slug: '', tipo: '', descripcion: '',
  thumbnail_url: '', youtube_video_id: '',
  duracion_minutos: '', orden: '0',
  is_live: false, activo: true, visibilidad: 'registrado',
};

function toSlug(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

function extractYouTubeId(input: string): string {
  const s = input.trim();
  const patterns = [
    /youtube\.com\/live\/([^?&/\s]+)/,
    /youtu\.be\/([^?&/\s]+)/,
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtube\.com\/embed\/([^?&/\s]+)/,
  ];
  for (const p of patterns) {
    const m = s.match(p);
    if (m) return m[1];
  }
  // Si no matchea ningún patrón, asumir que ya es un ID
  return s;
}

export function FormStreamingContenido() {
  const [loading, setLoading]       = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState<FormData>(EMPTY);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [expanded, setExpanded]     = useState(false); // campos opcionales
  const [ayuda, setAyuda]           = useState(false);

  useEffect(() => {
    supabase.from('streaming_categorias').select('slug, nombre').order('orden', { ascending: true })
      .then(({ data }) => {
        const cats = data ?? [];
        setCategorias(cats);
        if (cats.length > 0) setForm(f => f.tipo ? f : { ...f, tipo: cats[0].slug });
      });
  }, []);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const item = e.detail;
      setEditingId(item.id);
      setExpanded(true);
      setForm({
        titulo:            item.titulo ?? '',
        slug:              item.slug ?? '',
        tipo:              item.tipo ?? 'concierto',
        descripcion:       item.descripcion ?? '',
        thumbnail_url:     item.thumbnail_url ?? '',
        youtube_video_id:  item.youtube_video_id ?? '',
        duracion_minutos:  item.duracion_minutos != null ? String(item.duracion_minutos) : '',

        orden:             item.orden != null ? String(item.orden) : '0',
        is_live:           item.is_live ?? false,
        activo:            item.activo ?? true,
        visibilidad:       item.visibilidad ?? 'registrado',
      });
    };
    window.addEventListener('editStreamingContenido', handler as EventListener);
    return () => window.removeEventListener('editStreamingContenido', handler as EventListener);
  }, []);

  const set = (field: keyof FormData, value: string | boolean) =>
    setForm(f => ({ ...f, [field]: value }));

  const reset = () => { setEditingId(null); setForm(EMPTY); setExpanded(false); };

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

        orden:             parseInt(form.orden) || 0,
        is_live:           form.is_live,
        activo:            form.activo,
        visibilidad:       form.visibilidad,
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
    <div className="bg-manso-cream/5 p-6 rounded-[2.5rem] border border-manso-cream/10 shadow-xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-manso-cream">
          {editingId ? 'Editar Contenido' : 'Nuevo Contenido'}
        </h2>
        <button
          type="button"
          onClick={() => setAyuda(true)}
          className="w-7 h-7 rounded-full border border-manso-cream/15 flex items-center justify-center text-manso-cream/30 hover:text-manso-cream/60 hover:border-manso-cream/30 transition-all"
          title="¿Qué es Contenido de Streaming?"
        >
          <HelpCircle size={14} />
        </button>
      </div>

      {/* Modal ayuda */}
      {ayuda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setAyuda(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative bg-[#1D1D1B] border border-manso-cream/15 rounded-[2rem] p-8 max-w-md w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-black uppercase tracking-tight text-manso-cream">Contenido de Streaming</h3>
              <button onClick={() => setAyuda(false)} className="w-8 h-8 rounded-full border border-manso-cream/15 flex items-center justify-center text-manso-cream/40 hover:text-manso-cream transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-4 text-sm text-manso-cream/60 leading-relaxed">
              <p>Cada item acá es un video que aparece en el <span className="text-manso-cream font-bold">catálogo de /streaming</span> — debajo del canal en vivo.</p>
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 text-[8px] font-black uppercase tracking-widest bg-manso-cream/10 text-manso-cream/50 px-2 py-1 rounded-full mt-0.5">YouTube ID</span>
                  <p>El código al final de la URL de YouTube (ej: <span className="font-mono text-manso-cream/80 text-xs">dQw4w9WgXcQ</span>). Funciona para videos grabados y streams en vivo.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-red-600/20 text-red-400 px-2 py-1 rounded-full mt-0.5"><Wifi size={8} />Live</span>
                  <p>Marcá "En vivo" mientras el stream está activo. Al terminarlo desde la lista, el badge se apaga y el video queda como grabación en Multimedia.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-manso-cream/10 text-manso-cream/50 px-2 py-1 rounded-full mt-0.5"><Eye size={8} />Visibilidad</span>
                  <p>Controla quién puede ver el video en el catálogo. No afecta el canal principal.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

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

        {/* Tipo */}
        <div>
          <label className={labelCls}>Tipo</label>
          <div className="flex gap-2 flex-wrap">
            {categorias.map(cat => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => set('tipo', cat.slug)}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  form.tipo === cat.slug
                    ? 'bg-manso-terra text-manso-cream'
                    : 'bg-manso-cream/10 text-manso-cream/60 hover:bg-manso-cream/20'
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* YouTube Video ID */}
        <div>
          <label className={labelCls}>YouTube — URL o ID del video</label>
          <input
            className={inputCls + ' font-mono text-xs'}
            placeholder="https://youtube.com/watch?v=... o solo el ID"
            value={form.youtube_video_id}
            onChange={e => set('youtube_video_id', extractYouTubeId(e.target.value))}
          />
          {form.youtube_video_id && (
            <p className="mt-1 text-[9px] text-manso-cream/30 font-mono pl-1">
              ID guardado: {form.youtube_video_id}
            </p>
          )}
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

        {/* Duración + Precio + Orden en una fila */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Duración (min)</label>
            <input type="number" className={inputCls + ' text-center font-mono'} placeholder="90"
              value={form.duracion_minutos} onChange={e => set('duracion_minutos', e.target.value)} min="0" />
          </div>
          <div>
            <label className={labelCls}>Orden</label>
            <input type="number" className={inputCls + ' text-center font-mono'}
              value={form.orden} onChange={e => set('orden', e.target.value)} min="0" />
          </div>
        </div>

        {/* Visibilidad */}
        <VisibilidadToggle value={form.visibilidad} onChange={v => set('visibilidad', v)} />

        {/* Toggles pill: En vivo + Activo */}
        <div className="flex gap-2">
          {[
            { key: 'is_live' as const, label: 'En vivo', activeColor: 'bg-red-600/30 border-red-500/50 text-red-400' },
            { key: 'activo'  as const, label: 'Activo',  activeColor: 'bg-manso-olive/20 border-manso-olive/40 text-manso-olive' },
          ].map(({ key, label, activeColor }) => (
            <button
              key={key}
              type="button"
              onClick={() => set(key, !form[key])}
              className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                form[key]
                  ? activeColor
                  : 'bg-manso-cream/5 border-manso-cream/10 text-manso-cream/30 hover:border-manso-cream/20'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Campos opcionales colapsables */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-manso-cream/30 hover:text-manso-cream/60 transition-colors"
        >
          <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          {expanded ? 'Ocultar opcionales' : 'Slug + Descripción'}
        </button>

        {expanded && (
          <div className="space-y-4 pt-1">
            <div>
              <label className={labelCls}>Slug (URL)</label>
              <input className={inputCls + ' font-mono text-xs'} placeholder="mi-concierto-2025"
                value={form.slug} onChange={e => set('slug', toSlug(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Descripción</label>
              <textarea className={inputCls + ' resize-none'} rows={3}
                placeholder="Descripción del contenido..."
                value={form.descripcion} onChange={e => set('descripcion', e.target.value)} />
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-4 pt-1">
          {editingId && (
            <button type="button" onClick={reset}
              className="flex-1 bg-manso-cream/20 text-manso-cream py-4 rounded-3xl font-black uppercase tracking-widest hover:bg-manso-cream/30 transition-all">
              Cancelar
            </button>
          )}
          <button type="submit" disabled={loading}
            className="flex-1 bg-manso-terra text-manso-cream py-4 rounded-3xl font-black uppercase tracking-widest hover:bg-manso-cream hover:text-manso-black transition-all disabled:opacity-50">
            {loading ? (editingId ? 'Actualizando...' : 'Creando...') : (editingId ? 'Actualizar' : 'Crear Contenido')}
          </button>
        </div>
      </form>
    </div>
  );
}
