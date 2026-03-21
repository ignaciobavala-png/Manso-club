'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '@/components/shop/ProductCard';
import Link from 'next/link';
import { ScrambleText } from '@/components/ui/ScrambleText';

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  imagenes_urls: string[];
  descripcion?: string;
  stock: number;
  active: boolean;
  created_at: string;
}

export const TiendaHome = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(4);


    if (error) {
      // Fallback a mock data si hay error
      const mockData: Producto[] = [
        {
          id: '1',
          nombre: 'MANSO TEE BLACK',
          precio: 15000,
          imagenes_urls: ['/assets/manso1.webp'],
          descripcion: 'Edición limitada 2026',
          stock: 10,
          active: true,
          created_at: '2026-01-15'
        },
        {
          id: '2',
          nombre: 'MANSO HOODIE TERRA',
          precio: 28000,
          imagenes_urls: ['/assets/manso2.webp'],
          descripcion: 'Premium cotton blend',
          stock: 5,
          active: true,
          created_at: '2026-01-14'
        },
        {
          id: '3',
          nombre: 'MANSO CAP BEIGE',
          precio: 12000,
          imagenes_urls: ['/assets/manso3.webp'],
          descripcion: 'Limited edition',
          stock: 8,
          active: true,
          created_at: '2026-01-13'
        },
        {
          id: '4',
          nombre: 'MANSO TOTE BAG',
          precio: 8000,
          imagenes_urls: ['/assets/manso5.webp'],
          descripcion: 'Organic canvas',
          stock: 15,
          active: true,
          created_at: '2026-01-12'
        },
      ];
      setProductos(mockData);
    } else {
      setProductos(data || []);
    }
    setLoading(false);
  };

  // Si no hay productos, mostrar placeholder
  if (loading) {
    return (
      <section className="py-12 sm:py-16 px-4 sm:px-8 md:px-20" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[10px] uppercase tracking-widest text-black/60 font-bold mb-4 block">Tienda</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium leading-tight uppercase tracking-tighter italic text-black">
              <ScrambleText text="SELECCIONADOS" />
            </h2>
          </div>
          <div className="text-center text-black/60 py-8">
            Cargando productos...
          </div>
        </div>
      </section>
    );
  }

  // Determinar si mostrar productos o placeholders
  const showPlaceholders = productos.length === 0;

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-8 md:px-20" style={{ backgroundColor: '#F5F0E8' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[10px] uppercase tracking-widest text-black/60 font-bold mb-4 block">Tienda</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium leading-tight uppercase tracking-tighter italic text-black">
            SELECCIONADOS
          </h2>
        </div>

        {/* Grid de productos o placeholders */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-8 mb-8 sm:mb-12">
          {showPlaceholders ? (
            // Mostrar 4 cards placeholder
            Array.from({ length: 4 }).map((_, index) => (
              <div 
                key={`placeholder-${index}`}
                className="bg-gray-100 rounded-lg p-4 sm:p-6 md:p-8 flex items-center justify-center"
                style={{ backgroundColor: '#F0F0F0', minHeight: '200px sm:250px md:300px' }}
              >
                <span className="text-gray-500 text-center">Próximamente</span>
              </div>
            ))
          ) : (
            // Mostrar productos reales
            productos.map((producto) => (
              <ProductCard 
                key={producto.id} 
                producto={{
                  id: producto.id,
                  nombre: producto.nombre,
                  precio: producto.precio,
                  imagenes_urls: producto.imagenes_urls,
                  descripcion: producto.descripcion
                }} 
              />
            ))
          )}
        </div>

        {/* Botón ir a la tienda */}
        <div className="text-center">
          <Link 
            href="/tienda"
            className="inline-flex items-center gap-3 bg-black text-white px-12 py-6 text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all transform hover:-translate-y-1 active:scale-95 group rounded-full"
          >
            IR A LA TIENDA
            <ArrowRight 
              size={16} 
              className="transform transition-transform group-hover:translate-x-2" 
            />
          </Link>
        </div>
      </div>
    </section>
  );
};
