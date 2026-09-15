'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Loader2, Calendar, Package, User, Edit3, RotateCcw } from 'lucide-react';
import { formatMoneda } from '@/lib/precios';

interface Props {
  table: 'eventos' | 'productos' | 'artistas';
  title: string;
  refreshTrigger?: number;
  onEdit?: (item: any) => void;
}

const SOFT_DELETE_TABLES: Props['table'][] = ['productos', 'artistas'];

export function ItemList({ table, title, refreshTrigger, onEdit }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const usaSoftDelete = SOFT_DELETE_TABLES.includes(table);

  const fetchItems = async () => {
    setLoading(true);
    // Los ocultos también se listan: el tacho solo marca `active = false`, y
    // mientras la lista los escondía no había forma de recuperar algo apagado
    // por error —para Ana el producto simplemente desaparecía—.
    const { data } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false });

    const filas = data || [];
    // Los activos primero: lo oculto es archivo, no tiene que empujar hacia
    // abajo a lo que sí está publicado.
    setItems(
      usaSoftDelete
        ? [...filas].sort((a, b) => Number(b.active ?? true) - Number(a.active ?? true))
        : filas
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [table, refreshTrigger]);

  const toggleActivo = async (id: string, activo: boolean) => {
    if (activo && !confirm('¿Ocultar este producto? Deja de verse en la tienda, pero queda acá para volver a publicarlo cuando quieras.')) return;

    setSavingId(id);

    // Soft delete: se marca inactivo y se deja de listar en la tienda pública.
    // No se borra la imagen del storage para que sea reversible.
    const { data, error: dbError } = await supabase
      .from(table)
      .update({ active: !activo })
      .eq('id', id)
      .select('id');

    if (dbError) {
      alert(`Error al guardar: ${dbError.message}`);
    } else if (!data || data.length === 0) {
      alert('No se pudo guardar: la fila no se actualizó (revisá permisos/RLS).');
    } else {
      setItems(prev => prev.map(item => (item.id === id ? { ...item, active: !activo } : item)));
    }
    setSavingId(null);
  };

  if (loading) return <div className="p-8 text-center opacity-50 font-black uppercase text-[10px] tracking-widest text-manso-cream/60">Cargando gestión...</div>;

  const activos = usaSoftDelete ? items.filter(i => i.active ?? true).length : items.length;
  const ocultos = items.length - activos;

  return (
    <div className="bg-manso-cream/5 rounded-[2.5rem] border border-manso-cream/10 overflow-hidden shadow-sm mt-4 sm:mt-8">
      <div className="p-4 sm:p-6 border-b border-manso-cream/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 bg-manso-cream/5">
        <h3 className="font-black uppercase tracking-tighter flex items-center gap-2 text-manso-cream text-sm sm:text-base">
          {table === 'eventos' ? <Calendar size={14} /> : table === 'artistas' ? <User size={14} /> : <Package size={14} />}
          <span className="text-xs sm:text-sm">{title} ({activos})</span>
        </h3>
        {ocultos > 0 && (
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-manso-cream/40">
            + {ocultos} oculto{ocultos > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="divide-y divide-manso-cream/10 max-h-[70vh] overflow-y-auto">
        {items.map((item) => {
          const activo = item.active ?? true;
          return (
            <div
              key={item.id}
              className={`p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 hover:bg-manso-cream/5 transition-colors group ${activo ? '' : 'opacity-50'}`}
            >
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <img
                  src={item.imagen_url || (item.imagenes_urls && item.imagenes_urls[0])}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover opacity-80 group-hover:opacity-100 transition-all"
                  alt=""
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold uppercase text-xs sm:text-xs tracking-tight text-manso-cream truncate flex items-center gap-2">
                    {item.titulo || item.nombre}
                    {usaSoftDelete && !activo && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded bg-manso-cream/10 text-[8px] font-black uppercase tracking-widest text-manso-cream/50">
                        Oculto
                      </span>
                    )}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-manso-cream/60 font-mono truncate">
                    {item.fecha
                      ? new Date(item.fecha).toLocaleDateString()
                      : item.precio
                        // La moneda va escrita: en la lista conviven precios de
                        // referencia en dólares y en pesos.
                        ? formatMoneda(Number(item.precio), item.moneda === 'ARS' ? 'ARS' : 'USD')
                        : item.bio
                          ? `${item.bio.substring(0, 30)}...`
                          : 'Artista'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {table === 'productos' && onEdit && (
                  <button
                    onClick={() => onEdit(item)}
                    className="p-2 text-manso-cream/60 hover:text-manso-cream hover:bg-manso-cream/10 rounded-full transition-all flex-shrink-0"
                    title="Editar producto"
                  >
                    <Edit3 size={18} />
                  </button>
                )}

                <button
                  onClick={() => toggleActivo(item.id, activo)}
                  disabled={savingId === item.id}
                  title={activo ? 'Ocultar' : 'Volver a publicar'}
                  className={`p-2 rounded-full transition-all flex-shrink-0 hover:bg-manso-cream/10 ${
                    activo ? 'text-manso-cream/60 hover:text-manso-terra' : 'text-manso-cream/60 hover:text-green-400'
                  }`}
                >
                  {savingId === item.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : activo ? (
                    <Trash2 size={18} />
                  ) : (
                    <RotateCcw size={18} />
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="p-8 sm:p-12 text-center text-manso-cream/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em]">
            No hay nada publicado todavía.
          </div>
        )}
      </div>
    </div>
  );
}
