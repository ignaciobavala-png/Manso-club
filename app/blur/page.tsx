import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fechaCorta, leerConfig, leerLineup } from '@/lib/festival';
import { TituloDifuso } from '@/components/festival/TituloDifuso';
import { GaleriaLocacion } from '@/components/festival/GaleriaLocacion';
import { TextoResaltado } from '@/components/festival/TextoResaltado';
import { LineupCorrido } from '@/components/festival/LineupCorrido';
import { EscribeTexto } from '@/components/festival/Escribe';

/**
 * Lo que dice el hero. Por ahora no es el nombre del panel (`config.nombre`),
 * que sigue siendo "Subreal". El logo de la diseñadora
 * (`public/blur/blur-logo.png`) se probó y no gustó: volvió el filtro.
 */
const TITULO_HERO = 'Blur';

/** Foto de fondo mientras no se cargue un banner desde el panel. */
const BANNER_POR_DEFECTO = '/blur/hero-cabina.jpg';

/**
 * Home de BLUR. Arranca con el hero a pantalla completa —la foto a sangre tal
 * cual, sin filtros, el nombre con el redondeo difuso de Basilar y la fecha y
 * el lema en cajitas translúcidas— y scrollea por un adelanto de algunas
 * secciones (pedido del equipo): las fotos (las de Locación y las extra del
 * home), la Visión y el line-up, cada una con su link a la página entera.
 *
 * La foto del hero va `fixed`: las secciones de abajo tienen fondo propio y
 * suben por encima de ella al scrollear.
 */
export default async function FestivalHome() {
  const [config, lineup] = await Promise.all([leerConfig(), leerLineup()]);
  if (!config) notFound();

  const fecha = [fechaCorta(config.fecha), config.horario].filter(Boolean).join(' — ');
  const fotos = [...config.locacion_fotos, ...config.home_fotos];

  return (
    <>
    {/* Alto de pantalla menos el menú, que en el celular ocupa dos o tres renglones. */}
    <section className="relative min-h-[calc(100svh-6rem)] sm:min-h-[calc(100svh-3.25rem)] flex flex-col items-center justify-center text-center">
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

    {fotos.length > 0 && (
      <Seccion rotulo="Locación" href="/blur/locacion" ver="Ver locación">
        <GaleriaLocacion fotos={fotos} alt={config.lugar ?? 'Fotos del festival'} />
      </Seccion>
    )}

    {config.vision && (
      <Seccion rotulo="Visión" href="/blur/vision" ver="Leer visión">
        <TextoResaltado
          texto={config.vision}
          className="text-[clamp(17px,1.6vw,24px)] leading-[1.4] tracking-[-0.01em]"
        />
      </Seccion>
    )}

    {lineup.length > 0 && (
      <Seccion rotulo="Line up" href="/blur/line-up" ver="Ver line up">
        <LineupCorrido escenarios={lineup} />
      </Seccion>
    )}
    </>
  );
}

/** Un adelanto de sección: rótulo, contenido y el link a la página entera. */
function Seccion({
  rotulo,
  href,
  ver,
  children,
}: {
  rotulo: string;
  href: string;
  ver: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative z-10 bg-[var(--fest-fondo)] fest-fondo px-4 sm:px-7 pt-14 sm:pt-20 pb-6 sm:pb-10">
      <p className="fest-rotulo mb-8">
        <EscribeTexto texto={rotulo} />
      </p>
      {children}
      <Link
        href={href}
        className="fest-chevron fest-menu inline-block mt-8 sm:mt-10 text-[16px] sm:text-[18px] text-[var(--fest-acento)] hover:text-[var(--fest-texto)] transition-colors"
      >
        {ver}
      </Link>
    </section>
  );
}
