import { AdaptiveSectionLayout } from '@/components/ui/AdaptiveSectionLayout';

export default function ArtistasPage() {
  return (
    <AdaptiveSectionLayout title="Artistas" subtitle="Comunidad Manso_">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-10">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="aspect-[3/4] bg-zinc-800/50 rounded-[40px] overflow-hidden border border-zinc-700 group relative">
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-manso-cream transition-colors">
              Talento_0{i}
            </div>
          </div>
        ))}
      </div>
    </AdaptiveSectionLayout>
  );
}
