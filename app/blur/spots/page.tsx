import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { leerConfig, leerSpots } from '@/lib/festival';
import { GaleriaLocacion } from '@/components/festival/GaleriaLocacion';
import { EscribeTexto } from '@/components/festival/Escribe';
import { DECO, SeccionMarca } from '@/components/festival/SeccionMarca';
import { MARCA_SEO, resumenFestival } from '@/lib/festival-seo';
import { descripcion } from '@/lib/seo';
import { leerTextos } from '@/lib/festival-idioma-servidor';

export async function generateMetadata(): Promise<Metadata> {
  const [{ t }, config] = await Promise.all([leerTextos(), leerConfig()]);
  if (!config) return { title: t.spots.titulo };
  return { title: t.spots.titulo, description: descripcion(`Los spots de ${MARCA_SEO}: los lugares de la fiesta. ${resumenFestival(config)}`) };
}

/**
 * Los lugares de la fiesta (escenarios, rincones), uno debajo del otro: el
 * nombre grande, la descripción y sus fotos en el mismo mosaico que Locación,
 * enteras y ampliables. Se cargan en el panel (Festival → Spots).
 */
export default async function FestivalSpots() {
  const [config, spots, { t }] = await Promise.all([leerConfig(), leerSpots(), leerTextos()]);
  if (!config) notFound();

  return (
    <SeccionMarca
      tema="crema"
      deco={DECO.spots}
      className="flex-1 px-4 sm:px-7 pt-6 sm:pt-10 pb-20 sm:pb-24 fest-entra"
    >
      <p className="fest-rotulo mb-8">
        <EscribeTexto texto={t.spots.titulo} />
      </p>

      {spots.length === 0 ? (
        <p className="fest-mono text-sm opacity-60">{t.spots.pronto}</p>
      ) : (
        spots.map(spot => (
          <section key={spot.id} className="mb-16 sm:mb-24 last:mb-0">
            <h2 className="fest-ancha leading-[0.9] text-[clamp(1.75rem,3.6vw,3.25rem)] break-words">{spot.titulo}</h2>
            {spot.descripcion && (
              <p className="mt-5 max-w-[62ch] text-[clamp(16px,1.35vw,19px)] leading-[1.6] opacity-85 whitespace-pre-line">
                {spot.descripcion}
              </p>
            )}
            {spot.fotos.length > 0 && (
              <div className="mt-8 sm:mt-10">
                <GaleriaLocacion fotos={spot.fotos} alt={spot.titulo} />
              </div>
            )}
          </section>
        ))
      )}
    </SeccionMarca>
  );
}
