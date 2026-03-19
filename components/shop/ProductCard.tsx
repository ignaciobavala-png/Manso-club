// components/shop/ProductCard.tsx
'use client';

import { useCart } from '@/store/useCart';
import { Plus, ShoppingBag, Check } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface ProductProps {
  producto: {
    id: string;
    nombre: string;
    precio: number;
    imagenes_urls: string[];
    descripcion?: string;
  };
}

export function ProductCard({ producto }: ProductProps) {
  const addItem = useCart((state) => state.addItem);
  const [isAdded, setIsAdded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleAddToCart = () => {
    addItem(producto);
    setIsAdded(true);
    
    // Resetear el estado después de 2 segundos
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleImageChange = (direction: 'next' | 'prev') => {
    const totalImages = producto.imagenes_urls?.length || 0;
    if (totalImages <= 1) return;

    if (direction === 'next') {
      setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    } else {
      setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
    }
  };

  // Obtener imagen actual o fallback
  const currentImage = producto.imagenes_urls?.[currentImageIndex] || '/manso.png';
  
  
  return (
    <div className="group bg-white rounded-[20px] sm:rounded-[30px] md:rounded-[40px] border-2 border-zinc-300 overflow-hidden transition-all duration-500 hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] hover:scale-[1.02] cursor-pointer">
      {/* Contenedor principal clickeable - ahora redirige al detalle del producto */}
      <Link href={`/producto/${producto.id}`}>
        <div className="relative">
          {/* Contenedor de Imagen */}
          <div className="aspect-square w-full bg-zinc-50 relative overflow-hidden">
            <img 
              src={currentImage} 
              alt={producto.nombre}
              className="w-full h-full object-cover transition-all duration-700"
              onError={(e) => {
                // Fallback a manso.png si falla
                e.currentTarget.src = '/manso.png';
              }}
            />
          
          {/* Navegación de imágenes (solo si hay múltiples) */}
          {(producto.imagenes_urls?.length || 0) > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleImageChange('prev'); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleImageChange('next'); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ›
              </button>
              
              {/* Indicadores */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {producto.imagenes_urls.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Overlay de acción - ahora muestra "Ver detalles" */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 shadow-xl">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-black" />
                <span className="text-sm sm:text-base font-black uppercase tracking-wider text-black">Ver detalles</span>
              </div>
            </div>
          </div>

          {/* Badge de precio flotante */}
          <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 bg-black text-white px-2 sm:px-3 py-1 sm:py-2 rounded-xl sm:rounded-2xl shadow-lg">
            <span className="text-[9px] sm:text-xs font-black uppercase tracking-wider">
              ${producto.precio}
            </span>
          </div>
        </div>

        {/* Info del Producto */}
        <div className="p-3 sm:p-4 md:p-6">
          <div className="mb-3">
            <h3 className="text-base sm:text-lg md:text-xl font-black italic uppercase tracking-tighter text-black leading-none mb-2">
              {producto.nombre}
            </h3>
            <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
              {producto.descripcion || 'Edición limitada Manso_Club'}
            </p>
          </div>
          
          {/* Indicador de acción */}
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
              Click para ver detalles
            </span>
            <div className="flex items-center gap-1">
              <Plus size={14} className="text-zinc-400 group-hover:text-orange-600 transition-colors" />
              <Plus size={14} className="text-zinc-400 group-hover:text-orange-600 transition-colors -ml-1" />
            </div>
          </div>
        </div>
      </div>
      </Link>
    </div>
  );
}