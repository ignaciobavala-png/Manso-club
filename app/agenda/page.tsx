import { AdaptiveSectionLayout } from '@/components/ui/AdaptiveSectionLayout';

export default function AgendaPage() {
  return (
    <AdaptiveSectionLayout title="Agenda" subtitle="Eventos y sesiones_">
      <div className="space-y-4 py-10">
        <p className="text-zinc-500 italic text-sm">Conectando con la base de datos de Manso...</p>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="h-32 bg-zinc-50 rounded-[32px] border border-zinc-100 flex items-center px-8 justify-between group hover:bg-black transition-all cursor-pointer">
               <span className="text-xl font-black italic group-hover:text-white uppercase text-manso-black">Próximo Evento_0{i}</span>
               <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-manso-cream">Ver Detalles</span>
            </div>
          ))}
        </div>
      </div>
    </AdaptiveSectionLayout>
  );
}
