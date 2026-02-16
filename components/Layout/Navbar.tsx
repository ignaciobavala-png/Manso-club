'use client';

import { Menu, X, ShoppingBag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/store/useCart'; // Importamos el store del carrito
import { CartSidebar } from '@/components/shop/CartSidebar'; // Importamos el nuevo componente

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const pathname = usePathname();
  
  // Accedemos a los ítems del carrito para calcular el total de productos
  const cartItems = useCart((state) => state.items);
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Evitar hydration mismatch: el badge del carrito solo se muestra después del mount
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
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

  // Bloquear scroll del body cuando el menú mobile está abierto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

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

  // Lógica de colores unificada para desktop y mobile
  const getTextColor = (baseCondition: boolean) => 
    baseCondition ? 'text-manso-black' : 'text-manso-cream';

  return (
    <>
      <nav className={`fixed top-0 w-full z-40 transition-all duration-500 ${
        isCartOpen || isScrolled
          ? 'bg-white/90 backdrop-blur-md py-4 shadow-sm opacity-90' 
          : 'bg-transparent py-6'
      }`}>
        <div className="max-w-[1600px] mx-auto px-8 flex justify-between items-center">
          
          {/* LOGO OFICIAL */}
          <Link href="/" className="flex items-center gap-3 group">
            <img 
              src="/manso.png" 
              alt="Manso Club Logo" 
              className="h-10 w-auto transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
            />
            <h1 className={`text-xl font-black uppercase tracking-tighter leading-none italic transition-colors duration-500 ${
              getTextColor(isCartOpen || isLightBgPage || isScrolled)
            }`}>
              Manso Club_
            </h1>
          </Link>

          {/* NAVEGACIÓN DESKTOP */}
          <div className="hidden md:flex gap-10">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                className={`text-[10px] font-black uppercase tracking-[0.4em] hover:text-orange-600 transition-colors duration-500 ${
                  getTextColor(isCartOpen || isLightBgPage || isScrolled)
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* ACCIONES Y MENÚ MOBILE */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Botón Login - Solo visible en desktop */}
            <Link 
              href="/login"
              className={`hidden md:block px-6 py-2 text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                getTextColor(isCartOpen || isLightBgPage || isScrolled)
              } hover:bg-manso-black hover:text-manso-cream hover:border-manso-black`}
            >
              Login
            </Link>
            
            <div className="relative group cursor-pointer" onClick={() => setIsCartOpen(true)}>
              <ShoppingBag 
                size={18} 
                className={`transition-colors duration-500 hover:text-orange-600 ${
                  getTextColor(isCartOpen || isLightBgPage || isScrolled)
                }`} 
              />
              {/* Burbuja de notificación con el conteo de ítems */}
              {hasMounted && itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in duration-300 z-10">
                  {itemCount}
                </span>
              )}
            </div>

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden focus:outline-none transition-colors duration-500 hover:text-orange-600 ${
                getTextColor(isCartOpen || isLightBgPage || isScrolled)
              }`}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* CART SIDEBAR */}
        <CartSidebar 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
        />
      </nav>

      {/* MENÚ MOBILE DESPLEGABLE — fuera del nav para evitar herencia de estilos de scroll */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 w-full h-full bg-white z-[9999] flex flex-col"
          style={{ touchAction: 'none' }}
        >
          {/* Header del menú móvil */}
          <div className="flex justify-between items-center p-6 border-b border-zinc-100">
            <h2 className="text-xl font-black uppercase tracking-tighter text-manso-black">Menú</h2>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="text-manso-black hover:text-orange-600 transition-colors duration-300"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Contenido del menú */}
          <div className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto">
            {/* Botón Login en móvil */}
            <Link 
              href="/login"
              onClick={() => setIsMenuOpen(false)}
              className="px-6 py-3 text-[10px] font-black uppercase tracking-widest border border-manso-black text-manso-black hover:bg-manso-black hover:text-white transition-all duration-300 text-center"
            >
              Login
            </Link>
            
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                onClick={() => setIsMenuOpen(false)}
                className="text-sm font-black uppercase tracking-[0.4em] text-manso-black hover:text-orange-600 transition-colors duration-500 py-2 min-h-[44px] flex items-center justify-center"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
};