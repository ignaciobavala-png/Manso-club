'use client';

import Link from 'next/link';

export function FooterPlayer() {  //
return (
    <footer className="bg-manso-black px-6 py-12 md:py-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
        
        {/* Branding & Info */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-[0.3em] mb-1 text-manso-cream/60">Be Colors</span>
            <h2 className="text-xl font-bold uppercase tracking-tighter leading-none text-manso-cream">Manso Club</h2>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-manso-cream/40">
            Cdad. de la Paz 601, C1426<br />
            Cdad. Autónoma de Buenos Aires
          </p>
          <div className="flex flex-col gap-2">
            <a 
              href="https://www.instagram.com/manso___club/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] uppercase tracking-widest text-manso-terra hover:text-manso-cream transition-colors duration-300"
            >
              @manso___club
            </a>
          </div>
        </div>

        {/* Links Rápidos - Alineados a la visión de la dueña */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-manso-terra">Manso</span>
            <div className="flex flex-col gap-2 text-[10px] uppercase tracking-widest font-medium text-manso-cream/60">
              <Link href="/about" className="hover:text-manso-cream transition-colors">Nosotros</Link>
              <a href="#manifiesto" className="hover:text-manso-cream transition-colors">Manifiesto</a>
              <Link href="/artistas" className="hover:text-manso-cream transition-colors">Artistas</Link>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-manso-terra">Servicios</span>
            <div className="flex flex-col gap-2 text-[10px] uppercase tracking-widest font-medium text-manso-cream/60">
              <a href="#agenda" className="hover:text-manso-cream transition-colors">Coworking</a>
              <Link href="/membresias" className="hover:text-manso-cream transition-colors">Membresías</Link>
              <a href="#agenda" className="hover:text-manso-cream transition-colors">Talleres</a>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-manso-terra">Cultura</span>
            <div className="flex flex-col gap-2 text-[10px] uppercase tracking-widest font-medium text-manso-cream/60">
              <Link href="/tienda" className="hover:text-manso-cream transition-colors">Tienda</Link>
              <a href="#agenda" className="hover:text-manso-cream transition-colors">Club</a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};