import { AdaptiveSectionLayout } from '@/components/ui/AdaptiveSectionLayout';

export default function AboutPage() {
  return (
    <AdaptiveSectionLayout title="Manifesto" subtitle="Nuestra esencia_">
      <div className="max-w-2xl space-y-12 py-10">
        <p className="text-3xl md:text-5xl font-black italic tracking-tighter leading-tight uppercase text-manso-black">
          "Manso es un refugio para la creación sin ruido."
        </p>
        <div className="h-px bg-zinc-300 w-24" />
        <p className="text-zinc-600 uppercase text-[11px] tracking-[0.3em] font-bold leading-relaxed">
          [BOCETO]: Espacio reservado para la visión del club y manifiesto artístico.
        </p>
      </div>
    </AdaptiveSectionLayout>
  );
}
