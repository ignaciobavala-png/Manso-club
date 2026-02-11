
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
            Buenos Aires, Argentina — 2026
          </p>
        </div>

        {/* Links Rápidos - Alineados a la visión de la dueña */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-manso-terra">Manso</span>
            <div className="flex flex-col gap-2 text-[10px] uppercase tracking-widest font-medium text-manso-cream/60">
              <a href="#quienes-somos" className="hover:text-manso-cream transition-colors">Nosotros</a>
              <a href="#manifiesto" className="hover:text-manso-cream transition-colors">Manifiesto</a>
              <a href="#artistas" className="hover:text-manso-cream transition-colors">Artistas</a>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-manso-terra">Servicios</span>
            <div className="flex flex-col gap-2 text-[10px] uppercase tracking-widest font-medium text-manso-cream/60">
              <a href="#espacio" className="hover:text-manso-cream transition-colors">Coworking</a>
              <a href="#membresias" className="hover:text-manso-cream transition-colors">Membresías</a>
              <a href="#talleres" className="hover:text-manso-cream transition-colors">Talleres</a>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-manso-terra">Cultura</span>
            <div className="flex flex-col gap-2 text-[10px] uppercase tracking-widest font-medium text-manso-cream/60">
              <a href="#tienda" className="hover:text-manso-cream transition-colors">Tienda</a>
              <a href="#club" className="hover:text-manso-cream transition-colors">Club</a>
              <a href="#vinos" className="hover:text-manso-cream transition-colors">Vinos</a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};