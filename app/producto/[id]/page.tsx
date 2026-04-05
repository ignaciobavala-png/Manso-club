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
    <>
      {/* Ocultar navbar global */}
      <style jsx global>{`
        nav.fixed {
          display: none !important;
        }
      `}</style>
      
      <div className="min-h-screen bg-white">
        {/* Navbar especial de producto - ÚNICO NAVBAR VISIBLE */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-zinc-100 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-20 py-3">
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

        {/* Contenido principal - Layout Compacto */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-20 py-6">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 min-h-[calc(100vh-6rem)] items-center">
          
          {/* Galería de imágenes - Compacta */}
          <div className="flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full space-y-3">
              <div className="aspect-square bg-zinc-50 rounded-[20px] overflow-hidden relative">
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80 transition-colors text-lg"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => handleImageChange('next')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80 transition-colors text-lg"
                  >
                    ›
                  </button>
                  
                  {/* Indicadores compactos */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                    {producto.imagenes_urls.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Miniaturas compactas */}
            {(producto.imagenes_urls?.length || 0) > 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 justify-center">
                {producto.imagenes_urls.map((imagen, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
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
          </div>

          {/* Información del producto - Layout Compacto */}
          <div className="flex flex-col justify-center space-y-6">
            {/* Título y precio - Compacto */}
            <div>
              <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-black leading-none mb-3">
                {producto.nombre}
              </h2>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-2xl md:text-3xl font-black text-black">
                  ${producto.precio}
                </span>
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                  + envío
                </span>
              </div>
            </div>

            {/* Stock y cantidad - Combinados */}
            <div className="space-y-4">
              {/* Stock indicator */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${producto.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-zinc-600">
                  {producto.stock > 0 ? `${producto.stock} unidades disponibles` : 'Consultar disponibilidad'}
                </span>
              </div>

              {/* Selector de cantidad */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-black uppercase tracking-wider text-zinc-400 min-w-[60px]">
                  Cantidad
                </span>
                <button
                  onClick={handleRestar}
                  disabled={producto.stock === 0 || cantidad <= 1}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                    producto.stock === 0 || cantidad <= 1
                      ? 'border-zinc-200 text-zinc-300 cursor-not-allowed'
                      : 'border-black text-black hover:bg-black hover:text-white'
                  }`}
                >
                  <Minus size={18} />
                </button>
                
                <span className="text-xl font-black text-black w-12 text-center">
                  {cantidad}
                </span>
                
                <button
                  onClick={handleSumar}
                  disabled={producto.stock === 0 || cantidad >= producto.stock}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                    producto.stock === 0 || cantidad >= producto.stock
                      ? 'border-zinc-200 text-zinc-300 cursor-not-allowed'
                      : 'border-black text-black hover:bg-black hover:text-white'
                  }`}
                >
                  <Plus size={18} />
                </button>
                
                {producto.stock > 0 && (
                  <span className="text-xs text-zinc-500">
                    ({producto.stock} disp.)
                  </span>
                )}
              </div>
            </div>

            {/* Descripción resumida */}
            <div className="space-y-2">
              <div className="line-clamp-2 text-sm leading-relaxed text-black/70">
                {producto.descripcion || 'Edición limitada Manso_Club. Producto exclusivo con la calidad y diseño que nos caracteriza.'}
              </div>
            </div>

            {/* Botones de acción - Responsive */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Botón Agregar al carrito */}
              <button
                onClick={handleAddToCart}
                className={`flex-1 py-4 rounded-full font-black uppercase tracking-widest text-xs sm:text-sm transition-all transform hover:-translate-y-0.5 active:scale-95 ${
                  producto.stock === 0
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <ShoppingBag size={16} className="sm:hidden" />
                  <ShoppingBag size={20} className="hidden sm:block" />
                  <span>{producto.stock === 0 ? 'Consultar' : 'Agregar al carrito'}</span>
                </div>
              </button>

              {/* Botón Comprar ahora */}
              <button
                onClick={handleBuyNow}
                className={`flex-1 py-4 rounded-full font-black uppercase tracking-widest text-xs sm:text-sm transition-all transform hover:-translate-y-0.5 active:scale-95 ${
                  producto.stock === 0
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <CheckoutIcon size={16} className="sm:hidden" />
                  <CheckoutIcon size={20} className="hidden sm:block" />
                  <span>{producto.stock === 0 ? 'Consultar' : 'Comprar ahora'}</span>
                </div>
              </button>
            </div>

            {/* Trust Signals - Discretos */}
            <div className="pt-4 border-t border-zinc-100">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center">
                    <Truck className="w-3 h-3 text-black" />
                  </div>
                  <span className="text-xs text-zinc-500 text-center">Envío todo país</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center">
                    <Shield className="w-3 h-3 text-black" />
                  </div>
                  <span className="text-xs text-zinc-500 text-center">Pago seguro</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center">
                    <RotateCcw className="w-3 h-3 text-black" />
                  </div>
                  <span className="text-xs text-zinc-500 text-center">30 días devolución</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
