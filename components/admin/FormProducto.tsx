'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ImageUploader } from './ImageUploader';
import { Tag, DollarSign, Package } from 'lucide-react';
import { CATEGORIAS_TIENDA } from '@/lib/constants';
import type { Categoria } from '@/lib/constants'; // Importación de tipo separada

export function FormProducto() {
  const [loading, setLoading] = useState(false);
  
  // Definimos la interfaz del estado para que coincida con los tipos de Supabase
  const [formData, setFormData] = useState<{
    nombre: string;
    categoria: Categoria;
    precio: number;
    imagen_url: string;
  }>({
    nombre: '',
    categoria: CATEGORIAS_TIENDA[0], 
    precio: 0,
    imagen_url: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.imagen_url) {
      alert('Por favor, sube una imagen del producto.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('productos').insert([formData]);

    if (error) {
      alert(error.message);
    } else {
      alert('¡Producto sincronizado con la tienda!');
      setFormData({ 
        nombre: '', 
        categoria: CATEGORIAS_TIENDA[0], 
        precio: 0, 
        imagen_url: '' 
      });
      // Recarga para refrescar el inventario visualmente
      window.location.reload();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-200/50">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Zona de Carga de Imagen */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">
            Imagen del Producto
          </label>
          <ImageUploader 
            bucket="flyers" 
            onUpload={(url) => setFormData({...formData, imagen_url: url})} 
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Nombre del Producto */}
          <div className="relative">
            <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input 
              type="text" 
              placeholder="NOMBRE DEL ARTÍCULO"
              className="w-full bg-zinc-50 p-4 pl-12 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 outline-none font-bold text-zinc-800 placeholder:text-zinc-300 transition-all"
              value={formData.nombre}
              onChange={e => setFormData({...formData, nombre: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selector de Categoría (Sincronizado) */}
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={20} />
              <select 
                className="w-full bg-zinc-50 p-4 pl-12 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 outline-none appearance-none font-bold text-zinc-700 cursor-pointer"
                value={formData.categoria}
                onChange={e => setFormData({...formData, categoria: e.target.value as Categoria})}
              >
                {CATEGORIAS_TIENDA.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Precio en Moneda */}
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              <input 
                type="number" 
                placeholder="PRECIO"
                className="w-full bg-zinc-50 p-4 pl-12 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 outline-none font-mono font-bold"
                value={formData.precio === 0 ? '' : formData.precio}
                onChange={e => setFormData({...formData, precio: Number(e.target.value)})}
                required
              />
            </div>
          </div>
        </div>

        {/* Botón de Acción */}
        <button 
          disabled={loading}
          className="w-full bg-black text-white py-5 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-zinc-200/50"
        >
          {loading ? 'PROCESANDO...' : 'PUBLICAR PRODUCTO'}
        </button>
      </form>
    </div>
  );
}