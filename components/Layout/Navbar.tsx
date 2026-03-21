'use client';

import { Menu, X, ShoppingBag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/store/useCart';
import { CartSidebar } from '@/components/shop/CartSidebar';

const sidebarLinks = [
  { name: 'Manifiesto',           href: '/manifiesto' },
  { name: 'Multimedia',           href: '/multimedia' },
  { name: 'Presentá tu proyecto', href: '/presenta-tu-proyecto' },
  { name: 'Trabajá con nosotros', href: '/trabaja-con-nosotros' },
];

export const Navbar = () => {
  const [isMenuOpen,    setIsMenuOpen]    = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled,    setIsScrolled]    = useState(false);
  const [isCartOpen,    setIsCartOpen]    = useState(false);
  const [hasMounted,    setHasMounted]    = useState(false);
  const pathname = usePathname();

  const cartItems = useCart((state) => state.items);
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => { setHasMounted(true); }, []);

  const isLightBgPage = pathname?.includes('/about')    ||
                        pathname?.includes('/tienda')   ||
                        pathname?.includes('/checkout');

  // Scroll listener
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Bloquear scroll del body cuando algún overlay está abierto
  useEffect(() => {
    document.body.style.overflow = (isMenuOpen || isSidebarOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen, isSidebarOpen]);

  // Cerrar carrito con scroll agresivo
  useEffect(() => {
    if (!isCartOpen) return;
    const onScroll = () => { if (window.scrollY > 300) setIsCartOpen(false); };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [isCartOpen]);

  // Cerrar sidebar al cambiar de página
  useEffect(() => {
    setIsSidebarOpen(false);
    setIsMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'about us',   href: '/about' },
    { name: 'membresias', href: '/membresias' },
    { name: 'agenda',     href: '/agenda' },
    { name: 'artistas',   href: '/artistas' },
    { name: 'tienda',     href: '/tienda' },
  ];

  const getTextColor = (light: boolean) =>
    light ? 'text-manso-black' : 'text-manso-cream';

  const isLight = isCartOpen || isLightBgPage || isScrolled;

  return (
    <>
      <nav className={`fixed top-0 w-full z-40 transition-all duration-500 ${
        isCartOpen || isScrolled
          ? 'bg-white/90 backdrop-blur-md py-4 shadow-sm opacity-90'
          : 'bg-transparent py-6'
      }`}>
        <div className="max-w-[1600px] mx-auto px-8 flex justify-between items-center">

          {/* LADO IZQUIERDO: botón + y logo */}
          <div className="flex items-center gap-4 ml-8">
            {/* Botón + que rota a × */}
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              aria-label="Abrir menú de secciones"
              className={`transition-all duration-300 hover:text-manso-terra focus:outline-none ${
                getTextColor(isLight)
              }`}
            >
              <span
                className="block text-2xl font-thin leading-none select-none transition-transform duration-300"
                style={{ transform: isSidebarOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
              >
                +
              </span>
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <img
                src="/estesi.png"
                alt="Manso Club Logo"
                className="h-14 w-auto transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
              />
            </Link>
          </div>

          {/* NAVEGACIÓN DESKTOP */}
          <div className="hidden md:flex gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-[10px] font-black uppercase tracking-[0.4em] hover:text-orange-600 transition-colors duration-500 ${
                  getTextColor(isLight)
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* ACCIONES */}
          <div className="flex items-center gap-4 md:gap-6">
            <Link
              href="/login"
              className={`hidden md:block px-6 py-2 text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                getTextColor(isLight)
              } hover:bg-manso-black hover:text-manso-cream hover:border-manso-black`}
            >
              Login
            </Link>

            <div className="relative group cursor-pointer" onClick={() => setIsCartOpen(true)}>
              <ShoppingBag
                size={18}
                className={`transition-colors duration-500 hover:text-orange-600 ${getTextColor(isLight)}`}
              />
              {hasMounted && itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center z-10">
                  {itemCount}
                </span>
              )}
            </div>

            {/* Hamburger — solo mobile */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden focus:outline-none transition-colors duration-500 hover:text-orange-600 ${
                getTextColor(isLight)
              }`}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </nav>

      {/* SIDEBAR IZQUIERDO — secciones extra */}
      {/* Backdrop */}
      <div
        onClick={() => setIsSidebarOpen(false)}
        className={`fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      {/* Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-72 z-[999] bg-manso-black flex flex-col pt-28 pb-12 px-10 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <p className="text-[9px] font-black uppercase tracking-[0.6em] text-manso-terra mb-10">
          Manso Club
        </p>

        <nav className="flex flex-col gap-8">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsSidebarOpen(false)}
              className="text-2xl font-black uppercase italic tracking-tighter text-manso-cream hover:text-manso-terra transition-colors duration-300 leading-none"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-manso-cream/10">
          <p className="text-[9px] text-manso-cream/30 uppercase tracking-widest">
            Buenos Aires — 2026
          </p>
        </div>
      </div>

      {/* MENÚ MOBILE */}
      {isMenuOpen && (
        <div className="fixed inset-0 w-full h-full bg-white z-[9999] flex flex-col" style={{ touchAction: 'none' }}>
          <div className="flex justify-between items-center p-6 border-b border-zinc-100">
            <h2 className="text-xl font-black uppercase tracking-tighter text-manso-black">Menú</h2>
            <button onClick={() => setIsMenuOpen(false)} className="text-manso-black hover:text-orange-600 transition-colors">
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto">
            <Link href="/login" onClick={() => setIsMenuOpen(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest border border-manso-black text-manso-black hover:bg-manso-black hover:text-white transition-all text-center">
              Login
            </Link>
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} onClick={() => setIsMenuOpen(false)} className="text-sm font-black uppercase tracking-[0.4em] text-manso-black hover:text-orange-600 transition-colors py-2 min-h-[44px] flex items-center justify-center">
                {link.name}
              </Link>
            ))}
            <div className="border-t border-zinc-100 pt-6 flex flex-col gap-4">
              {sidebarLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)} className="text-sm font-black uppercase tracking-[0.4em] text-manso-black/50 hover:text-orange-600 transition-colors py-2 flex items-center justify-center">
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
