'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Plus } from 'lucide-react';

interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  color: string;
  orden: number;
}

const COLORES = [
  { label: 'Azul',   value: 'bg-manso-blue text-manso-cream' },
  { label: 'Olive',  value: 'bg-manso-olive text-white' },
  { label: 'Marrón', value: 'bg-manso-brown text-manso-cream' },
  { label: 'Terra',  value: 'bg-manso-terra text-manso-cream' },
  { label: 'Zinc',   value: 'bg-zinc-700 text-white' },
];

function toSlug(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

export function StreamingCategoriasAdmin() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nombre, setNombre]         = useState('');
  const [color, setColor]           = useState(COLORES[0].value);
  const [loading, setLoading]       = useState(false);

  const fetch = async () => {
    const { data } = await supabase.from('streaming_categorias').select('*').order('orden', { ascending: true });
    setCategorias(data ?? []);
  };

  useEffect(() => { fetch(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('streaming_categorias').insert([{
      nombre: nombre.trim(),
      slug: toSlug(nombre),
      color,
      orden: categorias.length,
    }]);
    if (error) { alert(error.message); }
    else { setNombre(''); fetch(); window.dispatchEvent(new CustomEvent('dashboardRefresh')); }
    setLoading(false);
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la categoría "${nombre}"? Los videos con ese tipo quedarán sin categoría.`)) return;
    const { error } = await supabase.from('streaming_categorias').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    fetch();
    window.dispatchEvent(new CustomEvent('dashboardRefresh'));
  };

  return (
    <div className="bg-manso-cream/5 rounded-[2.5rem] border border-manso-cream/10 p-8">
      <h3 className="text-lg font-black uppercase tracking-tighter text-manso-cream mb-6">Categorías</h3>

      {/* Lista */}
      <div className="space-y-2 mb-6">
        {categorias.map(cat => (
          <div key={cat.id} className="flex items-center justify-between gap-3 bg-manso-cream/5 rounded-2xl px-4 py-3 border border-manso-cream/10">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${cat.color}`}>
                {cat.nombre}
              </span>
              <span className="text-manso-cream/30 text-[10px] font-mono">/{cat.slug}</span>
            </div>
            <button
              onClick={() => handleDelete(cat.id, cat.nombre)}
              className="w-7 h-7 rounded-full bg-manso-terra/10 text-manso-terra/60 hover:bg-manso-terra/20 hover:text-manso-terra transition-all flex items-center justify-center"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {categorias.length === 0 && (
          <p className="text-manso-cream/30 text-xs text-center py-4 uppercase tracking-widest font-black">Sin categorías</p>
        )}
      </div>

      {/* Formulario agregar */}
      <form onSubmit={handleAdd} className="flex gap-2 flex-wrap">
        <input
          className="flex-1 min-w-0 p-3 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none text-manso-cream placeholder:text-manso-cream/40 text-sm font-bold"
          placeholder="Nueva categoría"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
        />
        <select
          value={color}
          onChange={e => setColor(e.target.value)}
          className="p-3 bg-manso-cream/10 rounded-2xl border border-manso-cream/20 text-manso-cream text-sm font-bold outline-none focus:ring-2 focus:ring-manso-terra"
        >
          {COLORES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-3 bg-manso-terra text-manso-cream rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-manso-cream hover:text-manso-black transition-all disabled:opacity-50"
        >
          <Plus size={14} />
          Agregar
        </button>
      </form>
    </div>
  );
}
