'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, ArrowRight, Plus, ShoppingBag, Check, Minus, Truck, Shield, RotateCcw, ArrowRight as CheckoutIcon } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/store/useCart';

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

export default function ProductoDetalle() {
  const params = useParams();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const addItem = useCart((state) => state.addItem);
  const items = useCart((state) => state.items);

  useEffect(() => {
    if (params.id) {
      fetchProducto(params.id as string);
    }
  }, [params.id]);

  const fetchProducto = async (id: string) => {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .single();

    if (error) {
      console.error('Error fetching producto:', error);
    } else {
      setProducto(data);
    }
    setLoading(false);
  };

  const handleImageChange = (direction: 'next' | 'prev') => {
    const totalImages = producto?.imagenes_urls?.length || 0;
    if (totalImages <= 1) return;

    if (direction === 'next') {
      setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    } else {
      setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
    }
  };

  const handleRestar = () => {
    setCantidad(prev => Math.max(1, prev - 1));
  };

  const handleSumar = () => {
    if (producto) {
      setCantidad(prev => Math.min(producto.stock, prev + 1));
    }
  };

  const handleAddToCart = () => {
    if (producto) {
      if (producto.stock === 0) {
        // Si no hay stock, redirigir al checkout
        window.location.href = '/checkout';
      } else {
        // Agregar el producto la cantidad de veces seleccionada
        for (let i = 0; i < cantidad; i++) {
          addItem({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagenes_urls: producto.imagenes_urls,
            stock: producto.stock
          });
        }
        
        // Toast de confirmación
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-in slide-in-from-right duration-300';
        toast.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span class="font-medium">${producto.nombre} (${cantidad}x) agregado al carrito</span>
        `;
        document.body.appendChild(toast);
        
        // Remover toast después de 3 segundos
        setTimeout(() => {
          toast.classList.add('animate-out', 'slide-out-to-right');
          setTimeout(() => {
            document.body.removeChild(toast);
          }, 300);
        }, 3000);
        
        // Redirigir a tienda después de 800ms
        setTimeout(() => {
          window.location.href = '/tienda';
        }, 800);
      }
    }
  };

  const handleBuyNow = () => {
    if (producto) {
      if (producto.stock === 0) {
        // Si no hay stock, redirigir al checkout
        window.location.href = '/checkout';
      } else {
        // Agregar el producto la cantidad de veces seleccionada y redirigir
        for (let i = 0; i < cantidad; i++) {
          addItem({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagenes_urls: producto.imagenes_urls,
            stock: producto.stock
          });
        }
        // Redirigir inmediatamente al checkout
        window.location.href = '/checkout';
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-black/60">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-black uppercase tracking-wider mb-4">Producto no encontrado</h1>
          <Link 
            href="/tienda"
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all rounded-full"
          >
            <ArrowLeft size={16} />
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  const currentImage = producto.imagenes_urls?.[currentImageIndex] || '/manso.png';

  return (
    <div className="min-h-screen bg-white">
      {/* Navegación */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-zinc-100 z-40">
        <div className="max-w-7xl mx-auto px-8 md:px-20 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/tienda"
              className="inline-flex items-center gap-2 text-black hover:text-gray-600 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-black uppercase tracking-wider">Volver</span>
            </Link>
            
            <Link 
              href="/tienda"
              className="inline-flex items-center gap-2 text-black hover:text-gray-600 transition-colors"
            >
              <span className="text-sm font-black uppercase tracking-wider">Ver tienda</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-8 md:px-20 py-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Galería de imágenes */}
          <div className="space-y-4">
            <div className="aspect-square bg-zinc-50 rounded-[40px] overflow-hidden relative">
              <img 
                src={currentImage}
                alt={producto.nombre}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/manso.png';
                }}
              />
              
              {/* Navegación de imágenes */}
              {(producto.imagenes_urls?.length || 0) > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => handleImageChange('prev')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => handleImageChange('next')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    ›
                  </button>
                  
                  {/* Indicadores */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {producto.imagenes_urls.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex ? 'bg-white w-8' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Miniaturas */}
            {(producto.imagenes_urls?.length || 0) > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {producto.imagenes_urls.map((imagen, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      index === currentImageIndex ? 'border-black' : 'border-transparent'
                    }`}
                  >
                    <img 
                      src={imagen} 
                      alt={`${producto.nombre} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/manso.png';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div className="space-y-8">
            {/* Título y precio */}
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black italic uppercase tracking-tighter text-black leading-none mb-4">
                {producto.nombre}
              </h1>
              <div className="flex items-baseline gap-4 mb-6">
                <span className="text-3xl font-black text-black">
                  ${producto.precio}
                </span>
                <span className="text-sm text-zinc-500 uppercase tracking-wider font-medium">
                  + envío
                </span>
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400">
                Descripción
              </h3>
              <p className="text-base leading-relaxed text-black/80">
                {producto.descripcion || 'Edición limitada Manso_Club. Producto exclusivo con la calidad y diseño que nos caracteriza.'}
              </p>
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${producto.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-zinc-600">
                {producto.stock > 0 ? `${producto.stock} unidades disponibles` : 'Consultar disponibilidad'}
              </span>
            </div>

            {/* Selector de cantidad */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400">
                Cantidad
              </h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleRestar}
                  disabled={producto.stock === 0 || cantidad <= 1}
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                    producto.stock === 0 || cantidad <= 1
                      ? 'border-zinc-200 text-zinc-300 cursor-not-allowed'
                      : 'border-black text-black hover:bg-black hover:text-white'
                  }`}
                >
                  <Minus size={20} />
                </button>
                
                <span className="text-2xl font-black text-black w-16 text-center">
                  {cantidad}
                </span>
                
                <button
                  onClick={handleSumar}
                  disabled={producto.stock === 0 || cantidad >= producto.stock}
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                    producto.stock === 0 || cantidad >= producto.stock
                      ? 'border-zinc-200 text-zinc-300 cursor-not-allowed'
                      : 'border-black text-black hover:bg-black hover:text-white'
                  }`}
                >
                  <Plus size={20} />
                </button>
                
                {producto.stock > 0 && (
                  <span className="text-sm text-zinc-500">
                    ({producto.stock} disponibles)
                  </span>
                )}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="pt-8 space-y-4">
              {/* Botón Agregar al carrito */}
              <button
                onClick={handleAddToCart}
                className={`w-full py-6 rounded-full font-black uppercase tracking-widest text-sm transition-all transform hover:-translate-y-1 active:scale-95 ${
                  producto.stock === 0
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <ShoppingBag size={20} />
                  <span>{producto.stock === 0 ? 'Consultar disponibilidad' : 'Agregar al carrito'}</span>
                </div>
              </button>

              {/* Botón Comprar ahora */}
              <button
                onClick={handleBuyNow}
                className={`w-full py-6 rounded-full font-black uppercase tracking-widest text-sm transition-all transform hover:-translate-y-1 active:scale-95 ${
                  producto.stock === 0
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <CheckoutIcon size={20} />
                  <span>{producto.stock === 0 ? 'Consultar disponibilidad' : 'Comprar ahora'}</span>
                </div>
              </button>
            </div>

            {/* Información adicional */}
            <div className="pt-8 border-t border-zinc-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center">
                  <Truck className="w-4 h-4 text-black" />
                </div>
                <span className="text-sm text-zinc-600">Envío a todo el país</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-black" />
                </div>
                <span className="text-sm text-zinc-600">Pago seguro</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center">
                  <RotateCcw className="w-4 h-4 text-black" />
                </div>
                <span className="text-sm text-zinc-600">Devoluciones dentro de los 30 días</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
