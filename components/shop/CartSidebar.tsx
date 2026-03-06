'use client';

import { X, Plus, Minus, Trash2, ShoppingBag, MessageCircle, ArrowRight } from 'lucide-react';
import { useCart } from '@/store/useCart';
import { useState, useEffect } from 'react';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { items, removeItem, addItem, clearCart, total, checkout } = useCart();
  const [footerPlayerHeight, setFooterPlayerHeight] = useState(0);

  // Detectar si el reproductor del footer está visible
  useEffect(() => {
    const checkFooterPlayer = () => {
      // Buscar el reproductor global usando data-attribute
      const footerPlayer = document.querySelector('[data-player="global"]');
      if (footerPlayer) {
        const height = footerPlayer.getBoundingClientRect().height;
        setFooterPlayerHeight(height);
      } else {
        setFooterPlayerHeight(0);
      }
    };

    // Verificar inicialmente y cuando el carrito se abre/cierra
    if (isOpen) {
      checkFooterPlayer();
      // También verificar después de un pequeño delay por si el reproductor aparece tarde
      const timeoutId = setTimeout(checkFooterPlayer, 100);
      return () => clearTimeout(timeoutId);
    }

    // Escuchar cambios en el DOM (cuando el reproductor aparece/desaparece)
    const observer = new MutationObserver(() => {
      if (isOpen) {
        checkFooterPlayer();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    return () => observer.disconnect();
  }, [isOpen]);

  const handleQuantityChange = (productId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    
    if (newQuantity <= 0) {
      removeItem(productId);
    } else if (change > 0) {
      // Para aumentar la cantidad, necesitamos encontrar el producto y agregarlo nuevamente
      const product = items.find(item => item.id === productId);
      if (product) {
        addItem({ 
          id: product.id, 
          nombre: product.nombre, 
          precio: product.precio, 
          imagenes_urls: product.imagenes_urls 
        });
      }
    } else {
      // Para disminuir la cantidad, eliminamos el item
      removeItem(productId);
    }
  };

  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
  };

  const handleClearCart = () => {
    clearCart();
    onClose();
  };

  const handleCheckout = () => {
    checkout();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-screen w-full max-w-md bg-white shadow-2xl z-[60] transform transition-all duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`} style={{ paddingBottom: footerPlayerHeight > 0 ? `${footerPlayerHeight}px` : '0px' }}>
        <div className="flex flex-col h-screen" style={{ height: `calc(100vh - ${footerPlayerHeight}px)` }}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                <ShoppingBag size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tighter italic text-black">
                  Tu Carrito
                </h2>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  {items.length} {items.length === 1 ? 'producto' : 'productos'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 rounded-lg transition-colors group"
              aria-label="Cerrar carrito"
            >
              <X size={20} className="text-zinc-600 group-hover:text-black transition-colors" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
                  <ShoppingBag size={40} className="text-zinc-400" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-black mb-3">
                  Tu carrito está vacío
                </h3>
                <p className="text-sm text-zinc-500 mb-8 max-w-xs">
                  Parece que aún no has agregado productos. ¡Explora nuestra tienda!
                </p>
                <button
                  onClick={onClose}
                  className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-wider hover:bg-orange-600 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                >
                  Ir a la Tienda
                  <MessageCircle size={16} />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-zinc-200 transition-all duration-200">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-zinc-200 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={item.imagenes_urls?.[0] || '/manso.png'}
                        alt={item.nombre}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-black text-sm uppercase tracking-tight truncate mb-1">
                        {item.nombre}
                      </h4>
                      <p className="text-lg font-black text-black mb-3">
                        {formatPrice(item.precio)}
                      </p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                          className="w-8 h-8 rounded-lg bg-white border border-zinc-300 flex items-center justify-center hover:bg-zinc-100 hover:border-zinc-400 transition-all duration-200 group"
                          aria-label="Disminuir cantidad"
                        >
                          <Minus size={14} className="text-zinc-600 group-hover:text-black" />
                        </button>
                        <span className="w-12 text-center font-bold text-black text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                          className="w-8 h-8 rounded-lg bg-white border border-zinc-300 flex items-center justify-center hover:bg-zinc-100 hover:border-zinc-400 transition-all duration-200 group"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus size={14} className="text-zinc-600 group-hover:text-black" />
                        </button>
                        
                        <div className="ml-auto flex items-center gap-2">
                          <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                            Subtotal:
                          </span>
                          <span className="text-sm font-bold text-black">
                            {formatPrice(item.precio * item.quantity)}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                          aria-label="Eliminar producto"
                        >
                          <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-zinc-100 bg-zinc-50/50 p-6 space-y-4">
              {/* Clear Cart Button */}
              <button
                onClick={handleClearCart}
                className="w-full text-left text-sm text-red-500 hover:text-red-600 font-medium transition-colors flex items-center gap-2 group"
              >
                <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                Vaciar carrito
              </button>

              {/* Total */}
              <div className="flex justify-between items-center py-3 border-t border-zinc-200">
                <span className="text-lg font-bold uppercase tracking-tight text-black">Total</span>
                <span className="text-2xl font-black text-black">
                  {formatPrice(total())}
                </span>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase tracking-wider hover:bg-gray-800 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-3 group"
              >
                Proceder al Checkout
                <ArrowRight size={18} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
