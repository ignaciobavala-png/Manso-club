import { SectionLayout } from '@/components/ui/SectionLayout';

export default function TiendaPage() {
  return (
    <SectionLayout title="Tienda" subtitle="Objetos y arte_">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-10">
        <div className="bg-zinc-50 aspect-square rounded-[60px] border border-zinc-100 flex items-center justify-center overflow-hidden">
           <div className="w-2/3 h-2/3 border-2 border-dashed border-zinc-200 rounded-full animate-spin-slow flex items-center justify-center">
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Preview_Product</span>
           </div>
        </div>
        <div className="flex flex-col justify-center">
          <h2 className="text-5xl md:text-7xl font-black italic uppercase mb-6 leading-none">Manso_<br/>Drop_01</h2>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.3em] mb-10 leading-relaxed max-w-sm">
            Curaduría de objetos que respiran la identidad del club. Próximamente disponible para la comunidad.
          </p>
          <button className="bg-black text-white py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-transform">
            Lista de espera
          </button>
        </div>
      </div>
    </SectionLayout>
  );
}
