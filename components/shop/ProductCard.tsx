// components/shop/ProductCard.tsx
'use client';

import { useCart } from '@/store/useCart';
import { Plus, ShoppingBag, Check } from 'lucide-react';
import { useState } from 'react';

interface ProductProps {
  producto: {
    id: string;
    nombre: string;
    precio: number;
    imagen_url: string;
    descripcion?: string;
  };
}

export function ProductCard({ producto }: ProductProps) {
  const addItem = useCart((state) => state.addItem);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    addItem(producto);
    setIsAdded(true);
    
    // Resetear el estado después de 2 segundos
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="group bg-white rounded-[40px] border border-zinc-100 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] cursor-pointer">
      {/* Contenedor principal clickeable */}
      <div onClick={handleAddToCart} className="relative">
        {/* Contenedor de Imagen */}
        <div className="aspect-square w-full bg-zinc-50 relative overflow-hidden">
          <img 
            src={producto.imagen_url || '/manso.png'} 
            alt={producto.nombre}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
          />
          
          {/* Overlay de acción */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm px-6 py-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 shadow-xl">
              <div className="flex items-center gap-2">
                {isAdded ? (
                  <>
                    <Check size={18} className="text-green-600" />
                    <span className="text-sm font-black uppercase tracking-wider text-green-600">Agregado</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} className="text-black" />
                    <span className="text-sm font-black uppercase tracking-wider text-black">Añadir</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Badge de precio flotante */}
          <div className="absolute top-4 right-4 bg-black text-white px-3 py-2 rounded-2xl shadow-lg">
            <span className="text-xs font-black uppercase tracking-wider">
              ${producto.precio}
            </span>
          </div>
        </div>

        {/* Info del Producto */}
        <div className="p-6">
          <div className="mb-3">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-black leading-none mb-2">
              {producto.nombre}
            </h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
              {producto.descripcion || 'Edición limitada Manso_Club'}
            </p>
          </div>
          
          {/* Indicador de acción */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
              Click para agregar
            </span>
            <div className="flex items-center gap-1">
              <Plus size={14} className="text-zinc-400 group-hover:text-orange-600 transition-colors" />
              <Plus size={14} className="text-zinc-400 group-hover:text-orange-600 transition-colors -ml-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}