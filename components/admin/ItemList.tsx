'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Loader2, Calendar, Package } from 'lucide-react';

interface Props {
  table: 'eventos' | 'productos';
  title: string;
}

export function ItemList({ table, title }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [table]);

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm('¿Estás segura de eliminar este item? Esta acción no se puede deshacer.')) return;
    
    setDeletingId(id);
    
    // 1. Borrar de la tabla
    const { error: dbError } = await supabase.from(table).delete().eq('id', id);
    
    if (!dbError) {
      // 2. Opcional: Borrar imagen del storage si es una URL de Supabase
      if (imageUrl.includes('storage/v1/object/public/flyers/')) {
        const fileName = imageUrl.split('/').pop();
        if (fileName) {
          await supabase.storage.from('flyers').remove([fileName]);
        }
      }
      setItems(items.filter(item => item.id !== id));
    } else {
      alert('Error al eliminar');
    }
    setDeletingId(null);
  };

  if (loading) return <div className="p-8 text-center opacity-50 font-black uppercase text-[10px] tracking-widest">Cargando gestión...</div>;

  return (
    <div className="bg-white rounded-[2.5rem] border border-zinc-100 overflow-hidden shadow-sm mt-8">
      <div className="p-6 border-b border-zinc-50 flex justify-between items-center bg-zinc-50/50">
        <h3 className="font-black uppercase tracking-tighter flex items-center gap-2">
          {table === 'eventos' ? <Calendar size={16} /> : <Package size={16} />}
          {title} ({items.length})
        </h3>
      </div>
      
      <div className="divide-y divide-zinc-50 max-h-[400px overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors group">
            <div className="flex items-center gap-4">
              <img 
                src={item.imagen_url} 
                className="w-12 h-12 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all" 
                alt="" 
              />
              <div>
                <p className="font-bold uppercase text-xs tracking-tight">{item.titulo || item.nombre}</p>
                <p className="text-[10px] text-zinc-400 font-mono">
                  {item.fecha ? new Date(item.fecha).toLocaleDateString() : `$${item.precio}`}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => handleDelete(item.id, item.imagen_url)}
              disabled={deletingId === item.id}
              className="p-3 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
            >
              {deletingId === item.id ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
            </button>
          </div>
        ))}

        {items.length === 0 && (
          <div className="p-12 text-center text-zinc-300 text-[10px] font-bold uppercase tracking-[0.2em]">
            No hay nada publicado todavía.
          </div>
        )}
      </div>
    </div>
  );
}