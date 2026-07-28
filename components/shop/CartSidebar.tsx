'use client';

import { X, Plus, Minus, Trash2, ShoppingBag, MessageCircle, ArrowRight } from 'lucide-react';
import { useCart } from '@/store/useCart';
import { useCurrency } from '@/store/useCurrency';
import { useState, useEffect } from 'react';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { items, removeItem, addItem, clearCart, total, checkout } = useCart();
  const { rate, fetchRate } = useCurrency();
  const [footerPlayerHeight, setFooterPlayerHeight] = useState(0);

  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

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
      // Para aumentar la cantidad, necesitamos encontrar el producto y validar stock
      const product = items.find(item => item.id === productId);
      if (product) {
        // Validar stock si está disponible
        const maxStock = product.stock || Number.MAX_SAFE_INTEGER;
        if (currentQuantity < maxStock) {
          addItem({ 
            id: product.id, 
            nombre: product.nombre, 
            precio: product.precio, 
            imagenes_urls: product.imagenes_urls,
            stock: product.stock
          });
        }
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

  // Los precios de los productos están en USD; el cobro se hace en pesos según
  // la cotización del blue. Hasta tenerla, se muestra el precio en dólares para
  // no exhibir un monto en pesos que no es el que se va a cobrar.
  const formatPrice = (priceUsd: number) => {
    if (!rate) return `USD $${priceUsd.toLocaleString('es-AR')}`;

    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(priceUsd * rate));
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
      <div className={`fixed top-0 right-0 h-screen w-full max-w-md bg-manso-black border-l border-manso-cream/10 shadow-2xl z-[60] transform transition-all duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`} style={{ paddingBottom: footerPlayerHeight > 0 ? `${footerPlayerHeight}px` : '0px' }}>
        <div className="flex flex-col h-screen" style={{ height: `calc(100vh - ${footerPlayerHeight}px)` }}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-manso-cream/10 bg-manso-cream/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-manso-terra rounded-xl flex items-center justify-center">
                <ShoppingBag size={20} className="text-manso-cream" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tighter italic text-manso-cream">
                  Tu Carrito
                </h2>
                <p className="text-[10px] text-manso-cream/40 uppercase tracking-wider">
                  {items.length} {items.length === 1 ? 'producto' : 'productos'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-manso-cream/10 rounded-lg transition-colors group"
              aria-label="Cerrar carrito"
            >
              <X size={20} className="text-manso-cream/60 group-hover:text-manso-cream transition-colors" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-24 h-24 bg-manso-cream/10 rounded-full flex items-center justify-center mb-6">
                  <ShoppingBag size={40} className="text-manso-cream/30" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-manso-cream mb-3">
                  Tu carrito está vacío
                </h3>
                <p className="text-sm text-manso-cream/50 mb-8 max-w-xs">
                  Parece que aún no has agregado productos. ¡Explora nuestra tienda!
                </p>
                <button
                  onClick={onClose}
                  className="bg-manso-terra text-manso-cream px-8 py-4 rounded-2xl font-black uppercase tracking-wider hover:bg-manso-terra/80 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                >
                  Ir a la Tienda
                  <MessageCircle size={16} />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-manso-cream/5 rounded-2xl border border-manso-cream/10 hover:border-manso-cream/25 transition-all duration-200">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-manso-cream/10 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={item.imagenes_urls?.[0] || '/manso.png'}
                        alt={item.nombre}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-manso-cream text-sm uppercase tracking-tight truncate mb-1">
                        {item.nombre}
                      </h4>
                      <p className="text-lg font-black text-manso-cream mb-3">
                        {formatPrice(item.precio)}
                      </p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                          className="w-8 h-8 rounded-lg bg-manso-cream/10 border border-manso-cream/25 flex items-center justify-center hover:bg-manso-cream/20 hover:border-manso-cream/40 transition-all duration-200 group"
                          aria-label="Disminuir cantidad"
                        >
                          <Minus size={14} className="text-manso-cream/70 group-hover:text-manso-cream" />
                        </button>
                        <span className="w-12 text-center font-bold text-manso-cream text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                          disabled={item.stock ? item.quantity >= item.stock : false}
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-200 group ${
                            item.stock && item.quantity >= item.stock
                              ? 'border-manso-cream/10 text-manso-cream/20 cursor-not-allowed'
                              : 'border-manso-cream/25 bg-manso-cream/10 hover:bg-manso-cream/20 hover:border-manso-cream/40'
                          }`}
                          aria-label="Aumentar cantidad"
                        >
                          <Plus size={14} className={`${item.stock && item.quantity >= item.stock ? 'text-manso-cream/20' : 'text-manso-cream/70 group-hover:text-manso-cream'} transition-colors`} />
                        </button>
                        
                        <div className="ml-auto flex items-center gap-2">
                          <span className="text-xs text-manso-cream/40 font-medium uppercase tracking-wider">
                            Subtotal:
                          </span>
                          <span className="text-sm font-bold text-manso-cream">
                            {formatPrice(item.precio * item.quantity)}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 text-manso-terra hover:bg-manso-terra/15 rounded-lg transition-all duration-200 group"
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
            <div className="border-t border-manso-cream/10 bg-manso-cream/5 p-6 space-y-4">
              {/* Clear Cart Button */}
              <button
                onClick={handleClearCart}
                className="w-full text-left text-sm text-manso-terra hover:text-manso-terra/80 font-medium transition-colors flex items-center gap-2 group"
              >
                <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                Vaciar carrito
              </button>

              {/* Total */}
              <div className="pt-3 border-t border-manso-cream/15">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold uppercase tracking-tight text-manso-cream">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-manso-cream block leading-none">
                      {formatPrice(total())}
                    </span>
                    {rate && (
                      <span className="text-[11px] text-manso-cream/40">
                        USD ${total().toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>
                </div>
                {rate && (
                  <p className="text-[11px] text-manso-cream/40 mt-2 leading-relaxed">
                    Precios en pesos según cotización del dólar blue ($
                    {rate.toLocaleString('es-AR')} por USD).
                  </p>
                )}
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full bg-manso-terra text-manso-cream py-4 rounded-2xl font-black uppercase tracking-wider hover:bg-manso-terra/80 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-3 group"
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
