import { notFound } from 'next/navigation';
import { fechaCorta, leerConfig } from '@/lib/festival';

/**
 * Logo BLUR de la diseñadora (PNG blanco sobre transparente, 993×165). Por
 * ahora no es el nombre del panel (`config.nombre`), que sigue siendo "Subreal".
 */
const LOGO_HERO = '/festival/blur-logo.png';
const TITULO_HERO = 'Blur';

/** Foto de fondo mientras no se cargue un banner desde el panel. */
const BANNER_POR_DEFECTO = '/festival/hero-cabina.jpg';

/**
 * Home de Subreal: como la de Basilar, solo el hero. La foto a sangre tal cual,
 * sin filtros, el logo BLUR de la diseñadora centrado y la fecha y el lema en
 * cajitas translúcidas.
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
      <img
        src={config.banner_url || BANNER_POR_DEFECTO}
        alt=""
        fetchPriority="high"
        decoding="async"
        className="fixed inset-0 w-full h-full object-cover object-[50%_70%]"
      />
      <div className="relative z-10 px-4 pb-6 fest-entra">
        <h1>
          <img
            src={LOGO_HERO}
            alt={TITULO_HERO}
            width={993}
            height={165}
            fetchPriority="high"
            className="block w-[clamp(240px,62vw,900px)] h-auto"
          />
        </h1>

        {(fecha || config.lema) && (
          <div className="mt-6 sm:mt-8 flex flex-col items-center gap-3 fest-mono text-[clamp(12px,1.3vw,17px)] tracking-[0.04em] uppercase text-[#2a1d18]">
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
        Presenta{' '}
        <b className="font-sans font-black normal-case tracking-[-0.02em] text-[15px] ml-1.5">manso club</b>
      </p>
    </section>
  );
}
