import Image from 'next/image';
import { AdaptiveSectionLayout } from '@/components/ui/AdaptiveSectionLayout';

export default function AboutPage() {
  return (
    <AdaptiveSectionLayout title="About Us" subtitle="Quiénes somos_">
      {/* Text + Casa */}
      <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
        <div className="w-full md:w-1/2 space-y-8">
          <p className="text-zinc-800 text-xl md:text-2xl leading-relaxed font-medium">
            Manso Club es un club creativo para personas curiosas: emprendedores, artistas, entusiastas y amantes de la cultura que buscan comunidad e inspiración.
          </p>
          <p className="text-zinc-800 text-xl md:text-2xl leading-relaxed font-medium">
            Manso nace de la idea de que los mejores proyectos surgen cuando se mezclan disciplinas, generaciones e ideas en un mismo lugar. Acá se puede trabajar, escuchar música, participar de talleres, descubrir artistas y compartir momentos con personas afines. Manso es un punto de encuentro ante una sociedad aislada y una plataforma que exporta talento local.
          </p>
        </div>
        <div className="w-full md:w-1/2 relative aspect-[4/3] rounded-2xl overflow-hidden">
          <Image
            src="/assets/about3.jpg"
            alt="Manso Club — Fachada del edificio"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            quality={95}
            priority
          />
        </div>
      </div>

      {/* Fotos debajo */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-8">
        <div className="relative aspect-[4/3] w-full sm:w-1/2 rounded-2xl overflow-hidden">
          <Image
            src="/assets/about1.webp"
            alt="Manso Club — DJ session"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>
        <div className="relative aspect-[4/3] w-full sm:w-1/2 rounded-2xl overflow-hidden">
          <Image
            src="/assets/about2.webp"
            alt="Manso Club — Espacio interior"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>
      </div>
    </AdaptiveSectionLayout>
  );
}
