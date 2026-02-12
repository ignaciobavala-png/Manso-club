'use client';

import { Menu, X, ShoppingBag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/store/useCart'; // Importamos el store del carrito
import { CartSidebar } from '@/components/shop/CartSidebar'; // Importamos el nuevo componente

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const pathname = usePathname();
  
  // Accedemos a los ítems del carrito para calcular el total de productos
  const cartItems = useCart((state) => state.items);
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  
  // Detectar si estamos en páginas con fondo claro
  const isLightBgPage = pathname?.includes('/about') || 
                        pathname?.includes('/agenda') || 
                        pathname?.includes('/tienda');

  // Efecto de scroll para cambiar la apariencia del Navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Efecto para cerrar el carrito solo con scroll muy agresivo
  useEffect(() => {
    const handleScroll = () => {
      if (isCartOpen && window.scrollY > 300) {
        setIsCartOpen(false);
      }
    };

    if (isCartOpen) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isCartOpen]);

  // Enlaces que coinciden con las rutas físicas creadas
  const navLinks = [
    { name: 'about us', href: '/about' },
    { name: 'membresias', href: '/membresias' },
    { name: 'agenda', href: '/agenda' },
    { name: 'artistas', href: '/artistas' },
    { name: 'tienda', href: '/tienda' },
  ];

  return (
    <nav className={`fixed top-0 w-full z-40 transition-all duration-500 ${
      isCartOpen || isScrolled
        ? 'bg-white/90 backdrop-blur-md py-4 shadow-sm opacity-90' 
        : 'bg-transparent py-6'
    }`}>
      <div className="max-w-[1600px] mx-auto px-8 flex justify-between items-center">
        
        {/* LOGO OFICIAL */}
        <a href="/" className="flex items-center gap-3 group">
          <img 
            src="/manso.png" 
            alt="Manso Club Logo" 
            className="h-10 w-auto transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
          />
          <h1 className={`text-xl font-black uppercase tracking-tighter leading-none italic transition-colors duration-500 ${
            isCartOpen || isLightBgPage || isScrolled ? 'text-manso-black' : 'text-manso-cream'
          }`}>
            Manso Club_
          </h1>
        </a>

        {/* NAVEGACIÓN DESKTOP */}
        <div className="hidden md:flex gap-10">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              className={`text-[10px] font-black uppercase tracking-[0.4em] hover:text-orange-600 transition-colors duration-500 ${
                isCartOpen || isLightBgPage || isScrolled ? 'text-manso-black' : 'text-manso-cream'
              }`}
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* ACCIONES Y MENÚ MOBILE */}
        <div className="flex items-center gap-6">
          <div className="relative group cursor-pointer" onClick={() => setIsCartOpen(true)}>
            <ShoppingBag 
              size={18} 
              className={`transition-colors duration-500 hover:text-orange-600 ${
                isCartOpen 
                  ? 'text-manso-black' 
                  : isLightBgPage 
                    ? 'text-manso-black' 
                    : isScrolled 
                      ? 'text-manso-black' 
                      : 'text-manso-cream'
              }`} 
            />
            {/* Burbuja de notificación con el conteo de ítems */}
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in duration-300 z-10">
                {itemCount}
              </span>
            )}
          </div>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`md:hidden focus:outline-none ${
              isCartOpen || isLightBgPage || isScrolled ? 'text-black' : 'text-white'
            }`}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MENÚ MOBILE DESPLEGABLE */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-zinc-100 flex flex-col p-8 gap-8 text-center shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              onClick={() => setIsMenuOpen(false)}
              className="text-sm font-black uppercase tracking-[0.4em] hover:text-orange-600"
            >
              {link.name}
            </a>
          ))}
        </div>
      )}

      {/* CART SIDEBAR */}
      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
      />
    </nav>
  );
};