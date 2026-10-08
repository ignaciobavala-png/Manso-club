import Image from 'next/image';
import { notFound } from 'next/navigation';
import { fechaCorta, leerConfig } from '@/lib/festival';
import { TituloDifuso } from '@/components/festival/TituloDifuso';

/**
 * Lo que dice el hero. Por ahora no es el nombre del panel (`config.nombre`),
 * que sigue siendo "Subreal". El logo de la diseñadora
 * (`public/blur/blur-logo.png`) se probó y no gustó: volvió el filtro.
 */
const TITULO_HERO = 'Blur';

/** Foto de fondo mientras no se cargue un banner desde el panel. */
const BANNER_POR_DEFECTO = '/blur/hero-cabina.jpg';

/**
 * Home de Subreal: como la de Basilar, solo el hero. La foto a sangre tal cual,
 * sin filtros, el nombre con el redondeo difuso de Basilar centrado y la fecha
 * y el lema en cajitas translúcidas.
 *
 * La foto va `fixed` detrás de todo y el hero ocupa lo que queda entre el menú
 * y el pie (`flex-1` en el `main` del layout): antes tenía un alto calculado a
 * mano que no contaba el pie, y la página scrolleaba unos píxeles de más. El
 * pie queda encima de la foto.
 */
export default async function FestivalHome() {
  const config = await leerConfig();
  if (!config) notFound();

  const fecha = [fechaCorta(config.fecha), config.horario].filter(Boolean).join(' — ');

  return (
    <section className="relative flex-1 min-h-[440px] flex flex-col items-center justify-center text-center">
      {/* `fill` pone la foto en absolute: el `fixed` lo lleva el contenedor. */}
      <div className="fixed inset-0">
        <Image
          src={config.banner_url || BANNER_POR_DEFECTO}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_70%]"
        />
      </div>
      <div className="relative z-10 px-4 pb-[22svh] fest-entra">
        <TituloDifuso texto={TITULO_HERO} />

        {(fecha || config.lema) && (
          <div className="mt-1 sm:mt-2 flex flex-col items-center gap-3 fest-mono text-[clamp(12px,1.3vw,17px)] tracking-[0.04em] uppercase text-[#2a1d18]">
            {fecha && (
              <span className="px-2 py-0.5 bg-[color-mix(in_srgb,var(--fest-acento)_55%,transparent)]">{fecha}</span>
            )}
            {config.lema && (
              <span className="px-2 py-0.5 bg-[color-mix(in_srgb,var(--fest-acento)_55%,transparent)]">
                {config.lema}
              </span>
            )}
          </div>
        )}
      </div>

      <p className="absolute z-10 left-4 sm:left-7 bottom-5 fest-mono text-[11px] uppercase tracking-[0.3em]">
        <b className="font-sans font-black normal-case tracking-[-0.02em] text-[15px]">manso club</b>
      </p>
    </section>
  );
}
