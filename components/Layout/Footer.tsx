'use client';

import Link from 'next/link';
import { Instagram } from 'lucide-react';

export function Footer() {  //
return (
    <footer className="bg-manso-black px-6 py-6 md:py-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8">
        
        {/* Branding & Info */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold uppercase tracking-tighter leading-none text-manso-cream">Manso Club</h2>
          <a 
            href="https://maps.app.goo.gl/jbZ9rbGSr19T4AYG7" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] uppercase tracking-widest text-manso-cream/40 hover:underline transition-all duration-300"
          >
            Cdad. de la Paz 601, C1426<br />
            Cdad. Autónoma de Buenos Aires
          </a>
          <div className="flex flex-col gap-2">
            <a 
              href="https://www.instagram.com/manso___club/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-manso-terra hover:text-manso-cream transition-colors duration-300"
            >
              <Instagram size={12} />
              @manso___club
            </a>
          </div>
        </div>

        {/* Links Rápidos - Solo páginas existentes */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-manso-terra">Manso</span>
            <div className="flex flex-col gap-2 text-[10px] uppercase tracking-widest font-medium text-manso-cream/60">
              <Link href="/about" className="hover:text-manso-cream transition-colors">Nosotros</Link>
              <Link href="/artistas" className="hover:text-manso-cream transition-colors">Artistas</Link>
              <Link href="/agenda" className="hover:text-manso-cream transition-colors">Agenda</Link>
              <Link href="#" className="hover:text-manso-cream transition-colors">FAQS</Link>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-manso-terra">Servicios</span>
            <div className="flex flex-col gap-2 text-[10px] uppercase tracking-widest font-medium text-manso-cream/60">
              <Link href="/membresias" className="hover:text-manso-cream transition-colors">Membresías</Link>
              <Link href="/tienda" className="hover:text-manso-cream transition-colors">Tienda</Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};