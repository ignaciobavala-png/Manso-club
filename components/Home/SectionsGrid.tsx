'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CATEGORIAS_TIENDA } from '@/lib/constants';
import type { Categoria } from '@/lib/constants';
import { ShoppingBag, Loader2 } from 'lucide-react';

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  categoria: Categoria;
  imagen_url: string;
  created_at: string;
}

export function SectionsGrid() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState<Categoria>(CATEGORIAS_TIENDA[0]);

  useEffect(() => {
    async function fetchProductos() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('productos')
          .select('*')
          .eq('categoria', categoriaActiva)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProductos((data as Producto[]) || []); // Cast para eliminar el 'any'
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProductos();
  }, [categoriaActiva]);

  return (
    <div className="w-full">
      {/* Filtros locales */}
      <nav className="flex gap-2 overflow-x-auto no-scrollbar mb-10 pb-2">
        {CATEGORIAS_TIENDA.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoriaActiva(cat)}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
              categoriaActiva === cat
                ? 'bg-manso-black text-white border-manso-black'
                : 'bg-transparent text-manso-black/60 border-manso-black/20 hover:border-manso-black/40'
            }`}
          >
            {cat}
          </button>
        ))}
      </nav>

      {loading ? (
        <div className="py-20 flex flex-col items-center opacity-20">
          <Loader2 className="animate-spin mb-2" size={24} />
          <p className="text-[9px] font-bold uppercase tracking-widest text-manso-black/40">Sincronizando...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12">
          {productos.map((prod) => (
            <div key={prod.id} className="group cursor-pointer">
              <div className="aspect-[4/5 overflow-hidden rounded-[2rem bg-zinc-50 mb-4 relative">
                <img
                  src={prod.imagen_url}
                  alt={prod.nombre}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-xl">
                    <ShoppingBag size={16} />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-start px-1">
                <h3 className="text-sm font-black uppercase tracking-tight leading-tight max-w-[70%] text-manso-black">
                  {prod.nombre}
                </h3>
                <span className="font-mono font-bold text-xs bg-manso-black/10 px-2 py-1 rounded text-manso-black">
                  ${prod.precio}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && productos.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-zinc-100 rounded-[2rem">
          <p className="text-manso-black/40 font-black uppercase tracking-widest text-[10px]">Sin stock en {categoriaActiva}</p>
        </div>
      )}
    </div>
  );
}