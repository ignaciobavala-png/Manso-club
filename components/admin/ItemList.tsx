'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Loader2, Calendar, Package, User } from 'lucide-react';

interface Props {
  table: 'eventos' | 'productos' | 'artistas';
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
      if (imageUrl.includes('storage/v1/object/public/')) {
        const bucketMatch = imageUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
        if (bucketMatch) {
          const [, bucketName, filePath] = bucketMatch;
          await supabase.storage.from(bucketName).remove([filePath]);
        }
      }
      setItems(items.filter(item => item.id !== id));
    } else {
      alert('Error al eliminar');
    }
    setDeletingId(null);
  };

  if (loading) return <div className="p-8 text-center opacity-50 font-black uppercase text-[10px] tracking-widest text-manso-cream/60">Cargando gestión...</div>;

  return (
    <div className="bg-manso-cream/5 rounded-[2.5rem] border border-manso-cream/10 overflow-hidden shadow-sm mt-4 sm:mt-8">
      <div className="p-4 sm:p-6 border-b border-manso-cream/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 bg-manso-cream/5">
        <h3 className="font-black uppercase tracking-tighter flex items-center gap-2 text-manso-cream text-sm sm:text-base">
          {table === 'eventos' ? <Calendar size={14} className="sm:size-16" /> : table === 'artistas' ? <User size={14} className="sm:size-16" /> : <Package size={14} className="sm:size-16" />}
          <span className="text-xs sm:text-sm">{title} ({items.length})</span>
        </h3>
      </div>
      
      <div className="divide-y divide-manso-cream/10 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 hover:bg-manso-cream/5 transition-colors group">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <img 
                src={item.imagen_url} 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover opacity-80 group-hover:opacity-100 transition-all" 
                alt="" 
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold uppercase text-xs sm:text-xs tracking-tight text-manso-cream truncate">{item.titulo || item.nombre}</p>
                <p className="text-[9px] sm:text-[10px] text-manso-cream/60 font-mono truncate">
                  {item.fecha ? new Date(item.fecha).toLocaleDateString() : item.precio ? `$${item.precio}` : item.bio ? `${item.bio.substring(0, 30)}...` : 'Artista'}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => handleDelete(item.id, item.imagen_url)}
              disabled={deletingId === item.id}
              className="p-2 sm:p-3 text-manso-cream/60 hover:text-manso-terra hover:bg-manso-cream/10 rounded-full transition-all flex-shrink-0"
            >
              {deletingId === item.id ? (
                <Loader2 size={16} className="sm:size-18 animate-spin" />
              ) : (
                <Trash2 size={16} className="sm:size-18" />
              )}
            </button>
          </div>
        ))}

        {items.length === 0 && (
          <div className="p-8 sm:p-12 text-center text-manso-cream/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em]">
            No hay nada publicado todavía.
          </div>
        )}
      </div>
    </div>
  );
}