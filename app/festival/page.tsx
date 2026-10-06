import { notFound } from 'next/navigation';
import { fechaCorta, leerConfig } from '@/lib/festival';

/**
 * Home de Subreal: como la de Basilar, solo el hero. Foto del panel a sangre,
 * el nombre en Archivo ancha y la fecha y el lema en cajitas resaltadas.
 */
export default async function FestivalHome() {
  const config = await leerConfig();
  if (!config) notFound();

  const fecha = [fechaCorta(config.fecha), config.horario].filter(Boolean).join(' — ');

  return (
    <section className="relative h-[calc(100svh-4.25rem)] min-h-[520px] overflow-hidden grid place-items-center text-center">
      {config.banner_url && (
        <img
          src={config.banner_url}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover [filter:sepia(0.25)_saturate(0.85)_contrast(0.92)_brightness(0.8)]"
        />
      )}
      {/* Viñeta hacia el color de fondo: el título se lee sobre cualquier foto. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,transparent_30%,color-mix(in_srgb,var(--fest-fondo)_65%,transparent)_100%)]"
      />

      <div className="relative z-10 px-4 fest-entra">
        <h1 className="fest-ancha leading-[0.82] text-[clamp(3.4rem,13.5vw,12.5rem)] [text-shadow:0_0_60px_rgb(0_0_0/0.35)]">
          {config.nombre}
        </h1>

        {(fecha || config.lema) && (
          <div className="mt-7 flex flex-col items-center gap-3.5 fest-mono text-[clamp(13px,1.4vw,18px)] tracking-[0.04em] uppercase">
            {fecha && (
              <span className="px-2.5 py-0.5 bg-[color-mix(in_srgb,var(--fest-acento)_78%,transparent)]">{fecha}</span>
            )}
            {config.lema && (
              <span className="px-2.5 py-0.5 bg-[color-mix(in_srgb,var(--fest-fondo)_72%,transparent)]">
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
