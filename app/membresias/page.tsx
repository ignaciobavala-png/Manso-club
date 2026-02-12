import { AdaptiveSectionLayout } from '@/components/ui/AdaptiveSectionLayout';

export default function MembresiasPage() {
  return (
    <AdaptiveSectionLayout title="Membresías" subtitle="Acceso exclusivo_">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-zinc-700 p-10 rounded-[40px] bg-zinc-800/50 hover:bg-zinc-700 hover:text-manso-cream transition-all group shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 text-zinc-400 group-hover:text-manso-cream/80 text-center">Nivel 0{i}</h3>
            <p className="text-4xl font-black italic mb-8 text-center uppercase tracking-tighter text-manso-cream">Manso_Member</p>
            <div className="space-y-4 mb-10 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">
              <p>+ Acceso Prioritario</p>
              <p>+ Contenido exclusivo</p>
            </div>
            <button className="w-full py-4 border border-zinc-600 rounded-2xl uppercase text-[10px] font-black text-manso-cream hover:border-manso-cream transition-colors">Próximamente</button>
          </div>
        ))}
      </div>
    </AdaptiveSectionLayout>
  );
}
