'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AgendaEvent {
  id: string;
  titulo: string;
  slug?: string;
  descripcion: string;
  contenido_detalle?: string;
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
  slug: '',
  descripcion: '',
  contenido_detalle: '',
  categoria: 'Taller',
  duracion: '2 horas',
  frecuencia: 'Mensual',
  precio: '0',
  cupos_maximos: '0',
  whatsapp_contacto: '',
  luma_url: '',
  visibilidad: 'publico' as 'publico' | 'registrado' | 'miembro',
};

function slugify(titulo: string) {
  return titulo
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Genera un slug único contra la tabla agenda, agregando -2, -3... si ya existe otro taller con el mismo slug. */
async function getUniqueSlug(base: string, excludeId: string | null): Promise<string> {
  const { data } = await supabase.from('agenda').select('id, slug').like('slug', `${base}%`);
  const existentes = new Set((data || []).filter(r => r.id !== excludeId).map(r => r.slug));

  if (!existentes.has(base)) return base;

  let i = 2;
  while (existentes.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

const categorias  = ['Taller', 'Curso', 'Sesión', 'Clase', 'Evento'];
const duraciones  = ['1 hora', '2 horas', '3 horas', '4 horas', 'Medio día', 'Día completo'];
const frecuencias = ['Semanal', 'Quincenal', 'Mensual', 'Bimensual', 'Trimestral'];

import { VisibilidadToggle } from './VisibilidadToggle';
import { AgendaFotosList } from './AgendaFotosList';

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
        slug:              ev.slug || '',
        descripcion:       ev.descripcion,
        contenido_detalle: ev.contenido_detalle || '',
        categoria:         ev.categoria,
        duracion:          ev.duracion,
        frecuencia:        ev.frecuencia,
        precio:            ev.precio.toString(),
        cupos_maximos:     (ev.cupos_maximos || 0).toString(),
        whatsapp_contacto: ev.whatsapp_contacto || '',
        luma_url:          ev.luma_url || '',
        visibilidad:       (ev as any).visibilidad ?? 'publico',
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

    // El slug es el "permalink" del taller: una vez creado no se toca aunque
    // se corrija el titulo despues, para no romper links ya compartidos.
    // Solo se genera (y se desambigua contra duplicados) al crear un taller nuevo.
    const slug = editingId && formData.slug
      ? formData.slug
      : await getUniqueSlug(slugify(formData.titulo), editingId);

    const payload = {
      titulo:            formData.titulo,
      slug,
      descripcion:       formData.descripcion,
      contenido_detalle: formData.contenido_detalle || null,
      categoria:         formData.categoria,
      duracion:          formData.duracion,
      frecuencia:        formData.frecuencia,
      precio:            parseInt(formData.precio) || 0,
      cupos_maximos:     parseInt(formData.cupos_maximos) || 0,
      whatsapp_contacto: formData.whatsapp_contacto,
      luma_url:          formData.luma_url || null,
      activo:            true,
      visibilidad:       formData.visibilidad,
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
          <label className={labelCls}>Descripción corta</label>
          <textarea
            placeholder="Bajada corta: se muestra en el listado de agenda y como resumen al compartir"
            rows={3}
            className={`${inputCls} resize-none`}
            value={formData.descripcion}
            onChange={e => set('descripcion', e.target.value)}
            required
          />
        </div>

        {/* Contenido detallado */}
        <div>
          <label className={labelCls}>Contenido de la página del taller</label>
          <textarea
            placeholder={'Texto completo que se ve en la página de detalle (columna derecha).\n\nDejá una línea en blanco para separar párrafos.\nUna línea EN MAYÚSCULAS se muestra como subtítulo (ej: ENCUENTRO I: IDEAS Y FORMA).\nUna línea que empieza con "." o "-" se muestra como ítem de lista.'}
            rows={10}
            className={`${inputCls} resize-none font-mono text-xs`}
            value={formData.contenido_detalle}
            onChange={e => set('contenido_detalle', e.target.value)}
          />
          <p className="text-[9px] text-manso-cream/30 mt-1 font-light">
            Línea en blanco = nuevo párrafo · línea EN MAYÚSCULAS = subtítulo · línea con &quot;.&quot; o &quot;-&quot; adelante = ítem de lista
          </p>
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

        {/* Visibilidad */}
        <VisibilidadToggle
          value={formData.visibilidad}
          onChange={v => set('visibilidad', v)}
        />

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

      {editingId && (
        <div className="mt-8">
          <AgendaFotosList agendaId={editingId} tallerTitulo={formData.titulo} />
        </div>
      )}
    </div>
  );
}
