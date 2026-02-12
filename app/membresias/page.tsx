import { SectionLayout } from '@/components/ui/SectionLayout';

export default function MembresiasPage() {
  return (
    <SectionLayout title="Membresías" subtitle="Acceso exclusivo_">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-zinc-100 p-10 rounded-[40px] bg-white hover:bg-black hover:text-white transition-all group shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 text-zinc-400 group-hover:text-zinc-500 text-center">Nivel 0{i}</h3>
            <p className="text-4xl font-black italic mb-8 text-center uppercase tracking-tighter">Manso_Member</p>
            <div className="space-y-4 mb-10 text-[10px] font-bold uppercase tracking-widest opacity-60 text-center">
              <p>+ Acceso Prioritario</p>
              <p>+ Contenido exclusivo</p>
            </div>
            <button className="w-full py-4 border border-zinc-200 rounded-2xl uppercase text-[10px] font-black group-hover:border-zinc-800 transition-colors">Próximamente</button>
          </div>
        ))}
      </div>
    </SectionLayout>
  );
}
