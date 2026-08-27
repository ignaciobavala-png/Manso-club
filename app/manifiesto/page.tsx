import type { Metadata } from 'next';
import { ParticleBackground } from '@/components/Home/ParticleBackground';
import { getManifiesto } from '@/lib/manifiesto';
import { TituloCinta } from '@/components/ui/TituloCinta';
import { SlideFrase, SlideImagen } from '@/components/Manifiesto/Slides';

export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Manifiesto | Manso Club',
  description: 'El manifiesto de Manso Club: nuestra visión sobre la cultura electrónica, el arte y el diseño en Buenos Aires.',
  openGraph: {
    title: 'Manifiesto | Manso Club',
    description: 'Nuestra visión sobre la cultura electrónica, el arte y el diseño en Buenos Aires.',
    images: [{ url: '/og-image.png', width: 800, height: 800 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Manifiesto | Manso Club',
    description: 'Nuestra visión sobre la cultura electrónica, el arte y el diseño en Buenos Aires.',
    images: ['/og-image.png'],
  },
};

export default async function ManifiestoPage() {
  const { contenido, slide1_imagen, slide1_frase, slide2_imagen } = await getManifiesto();
  const parrafos = contenido.trim()
    ? contenido.trim().split(/\n\n+/)
    : [];

  return (
    <div className="relative min-h-screen bg-manso-black">
      <ParticleBackground />

      {/* El título ocupa todo el ancho, así que sale del contenedor de lectura.
          El padding es el alto del navbar, que es fijo y transparente: la cinta
          arranca justo abajo. */}
      <div className="relative z-10 pt-24">
        <TituloCinta texto="Manifiesto" className="py-2 border-y border-manso-cream/10" />
      </div>

      {/* Las dos slides abren la página; el texto viene después */}
      <div className="relative z-10">
        <SlideFrase imagen={slide1_imagen} frase={slide1_frase} />
        <SlideImagen imagen={slide2_imagen} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 pt-24 pb-32">
        {parrafos.length > 0 ? (
          <div className="space-y-10 text-manso-cream/80 font-light leading-relaxed text-lg md:text-xl">
            {parrafos.map((p, i) => (
              <p key={i} className={i === parrafos.length - 1 ? 'text-manso-cream font-medium' : ''}>
                {p}
              </p>
            ))}
          </div>
        ) : (
          /* Placeholder: barras de texto redactado */
          <div className="space-y-10" aria-hidden="true">
            {[
              ['w-full', 'w-11/12', 'w-full', 'w-4/5'],
              ['w-full', 'w-full', 'w-10/12', 'w-full', 'w-3/4'],
              ['w-11/12', 'w-full', 'w-full', 'w-9/12'],
              ['w-full', 'w-10/12', 'w-full', 'w-full', 'w-8/12'],
              ['w-full', 'w-11/12', 'w-4/5'],
            ].map((lineas, pi) => (
              <div key={pi} className="space-y-3">
                {lineas.map((w, li) => (
                  <div
                    key={li}
                    className={`${w} h-[1.25em] rounded-sm bg-manso-cream/10`}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="mt-20 w-16 h-px bg-manso-terra" />
        <p className="mt-6 text-[9px] uppercase tracking-[0.5em] text-manso-cream/20">
          Buenos Aires — 2026
        </p>
      </div>
    </div>
  );
}
