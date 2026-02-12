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
    <div className="max-w-2xl mx-auto bg-manso-cream/5 p-8 rounded-[2.5rem] border border-manso-cream/10 shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Zona de Carga de Imagen */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-manso-cream/60 ml-2">
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
            <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/60" size={20} />
            <input 
              type="text" 
              placeholder="NOMBRE DEL ARTÍCULO"
              className="w-full bg-manso-cream/10 p-4 pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all"
              value={formData.nombre}
              onChange={e => setFormData({...formData, nombre: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selector de Categoría (Sincronizado) */}
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/60 pointer-events-none" size={20} />
              <select 
                className="w-full bg-manso-cream/10 p-4 pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none appearance-none font-bold text-manso-cream cursor-pointer"
                value={formData.categoria}
                onChange={e => setFormData({...formData, categoria: e.target.value as Categoria})}
              >
                {CATEGORIAS_TIENDA.map(cat => (
                  <option key={cat} value={cat} className="bg-manso-black text-manso-cream">{cat}</option>
                ))}
              </select>
            </div>

            {/* Precio en Moneda */}
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/60" size={20} />
              <input 
                type="number" 
                placeholder="PRECIO"
                className="w-full bg-manso-cream/10 p-4 pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-mono font-bold text-manso-cream placeholder:text-manso-cream/40"
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
          className="w-full bg-manso-terra text-manso-cream py-5 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'PROCESANDO...' : 'PUBLICAR PRODUCTO'}
        </button>
      </form>
    </div>
  );
}