'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toSlug } from '@/lib/slug';
import { Trash2, Plus, Pencil, X } from 'lucide-react';

interface ForoCategoria {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  orden: number;
  activo: boolean;
}

const CATEGORIA_VACIA = { nombre: '', slug: '', descripcion: '', orden: 0, activo: true };

// No usa useAdminForm a propósito: ese hook hace window.location.reload() tras cada
// submit, lo que resetearía el tab activo del admin. Acá el CRUD queda autocontenido
// para poder actualizar el estado local sin recargar la página.
export function ForoCategoriasAdmin() {
  const [categorias, setCategorias] = useState<ForoCategoria[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(CATEGORIA_VACIA);
  const [loading, setLoading] = useState(false);

  const fetchCategorias = async () => {
    const { data } = await supabase.from('foro_categorias').select('*').order('orden', { ascending: true });
    setCategorias(data ?? []);
  };

  useEffect(() => { fetchCategorias(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(CATEGORIA_VACIA);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setLoading(true);

    const payload = {
      nombre: form.nombre.trim(),
      slug: form.slug.trim() || toSlug(form.nombre),
      descripcion: form.descripcion.trim() || null,
      orden: form.orden,
      activo: form.activo,
    };

    const { error } = editingId
      ? await supabase.from('foro_categorias').update(payload).eq('id', editingId)
      : await supabase.from('foro_categorias').insert([payload]);

    if (error) {
      alert(error.message);
    } else {
      resetForm();
      fetchCategorias();
    }
    setLoading(false);
  };

  const handleEdit = (cat: ForoCategoria) => {
    setEditingId(cat.id);
    setForm({
      nombre: cat.nombre,
      slug: cat.slug,
      descripcion: cat.descripcion ?? '',
      orden: cat.orden,
      activo: cat.activo,
    });
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la categoría "${nombre}"? Los threads con esta categoría quedarán sin categoría.`)) return;
    const { error } = await supabase.from('foro_categorias').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    fetchCategorias();
  };

  return (
    <div className="bg-manso-cream/5 rounded-[2.5rem] border border-manso-cream/10 p-8">
      <h3 className="text-lg font-black uppercase tracking-tighter text-manso-cream mb-6">Categorías del foro</h3>

      {/* Lista */}
      <div className="space-y-2 mb-6">
        {categorias.map(cat => (
          <div key={cat.id} className="flex items-center justify-between gap-3 bg-manso-cream/5 rounded-2xl px-4 py-3 border border-manso-cream/10">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                cat.activo ? 'bg-manso-terra text-manso-cream' : 'bg-zinc-700 text-white'
              }`}>
                {cat.nombre}
              </span>
              <span className="text-manso-cream/30 text-[10px] font-mono">/{cat.slug}</span>
              {!cat.activo && <span className="text-manso-cream/30 text-[10px] uppercase">inactiva</span>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleEdit(cat)}
                className="w-7 h-7 rounded-full bg-manso-cream/10 text-manso-cream/60 hover:bg-manso-cream/20 hover:text-manso-cream transition-all flex items-center justify-center"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={() => handleDelete(cat.id, cat.nombre)}
                className="w-7 h-7 rounded-full bg-manso-terra/10 text-manso-terra/60 hover:bg-manso-terra/20 hover:text-manso-terra transition-all flex items-center justify-center"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
        {categorias.length === 0 && (
          <p className="text-manso-cream/30 text-xs text-center py-4 uppercase tracking-widest font-black">Sin categorías</p>
        )}
      </div>

      {/* Formulario agregar/editar */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex gap-2 flex-wrap">
          <input
            className="flex-1 min-w-0 p-3 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none text-manso-cream placeholder:text-manso-cream/40 text-sm font-bold"
            placeholder="Nombre"
            value={form.nombre}
            onChange={e => setForm({ ...form, nombre: e.target.value })}
            required
          />
          <input
            className="w-40 p-3 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none text-manso-cream placeholder:text-manso-cream/40 text-sm font-bold"
            placeholder="slug (auto)"
            value={form.slug}
            onChange={e => setForm({ ...form, slug: e.target.value })}
          />
          <input
            type="number"
            className="w-24 p-3 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none text-manso-cream placeholder:text-manso-cream/40 text-sm font-bold"
            placeholder="Orden"
            value={form.orden}
            onChange={e => setForm({ ...form, orden: parseInt(e.target.value, 10) || 0 })}
          />
        </div>
        <input
          className="p-3 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none text-manso-cream placeholder:text-manso-cream/40 text-sm"
          placeholder="Descripción (opcional)"
          value={form.descripcion}
          onChange={e => setForm({ ...form, descripcion: e.target.value })}
        />
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-manso-cream/60 text-xs font-bold uppercase tracking-widest">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={e => setForm({ ...form, activo: e.target.checked })}
            />
            Activa
          </label>
          <div className="flex gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 px-4 py-3 bg-manso-cream/10 text-manso-cream/70 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-manso-cream/20 transition-all"
              >
                <X size={14} />
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-3 bg-manso-terra text-manso-cream rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-manso-cream hover:text-manso-black transition-all disabled:opacity-50"
            >
              <Plus size={14} />
              {editingId ? 'Guardar cambios' : 'Agregar'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
