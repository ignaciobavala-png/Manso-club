import { ParticleBackground } from '@/components/Home/ParticleBackground';
import { getManifiesto } from '@/lib/manifiesto';

export const revalidate = 60;
export const metadata = { title: 'Manifiesto — Manso Club' };

export default async function ManifiestoPage() {
  const { contenido } = await getManifiesto();
  const parrafos = contenido.trim()
    ? contenido.trim().split(/\n\n+/)
    : [];

  return (
    <div className="relative min-h-screen bg-manso-black">
      <ParticleBackground />

      <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 pt-40 pb-32">
        <p className="text-[9px] font-black uppercase tracking-[0.6em] text-manso-terra mb-6">
          Manso Club
        </p>
        <h1 className="text-[clamp(3rem,8vw,6rem)] font-black uppercase italic tracking-tighter leading-none text-manso-cream mb-20">
          Manifiesto
        </h1>

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
