'use client';

import { Menu, X, ShoppingBag } from 'lucide-react';
import { useState, useEffect } from 'react';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Efecto de scroll para cambiar la apariencia del Navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Enlaces que coinciden con las IDs de tu App.tsx
  const navLinks = [
    { name: 'about us', href: '#manifesto' },
    { name: 'membresias', href: '#agenda' },
    { name: 'agenda', href: '#shop' },
    { name: 'artistas', href: '#shop' },
    { name: 'tienda', href: '#shop' },

  ];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
      isScrolled 
        ? 'bg-white/90 backdrop-blur-md py-4 shadow-sm' 
        : 'bg-transparent py-6'
    }`}>
      <div className="max-w-[1600px mx-auto px-8 flex justify-between items-center">
        
        {/* LOGO OFICIAL - Limpio y minimalista */}
        <a href="/" className="flex items-center gap-3 group">
          <img 
            src="/manso.png" 
            alt="Manso Club Logo" 
            className="h-10 w-auto transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
          />
          <h1 className={`text-xl font-black uppercase tracking-tighter leading-none italic transition-colors duration-500 ${
            isScrolled ? 'text-manso-black' : 'text-manso-cream'
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
                isScrolled ? 'text-manso-black' : 'text-manso-cream'
              }`}
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* ACCIONES Y MENÚ MOBILE */}
        <div className="flex items-center gap-6">
          <ShoppingBag 
            size={18} 
            className={`cursor-pointer hover:text-orange-600 transition-colors duration-500 ${
              isScrolled ? 'text-manso-black' : 'text-manso-cream'
            }`} 
          />
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-black focus:outline-none"
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
    </nav>
  );
};