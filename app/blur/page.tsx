import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fechaCorta, leerConfig, leerLineup } from '@/lib/festival';
import { LogoBlur } from '@/components/festival/LogoBlur';
import { GaleriaLocacion } from '@/components/festival/GaleriaLocacion';
import { TextoResaltado } from '@/components/festival/TextoResaltado';
import { LineupCorrido } from '@/components/festival/LineupCorrido';
import { EscribeTexto } from '@/components/festival/Escribe';
import { leerTextos } from '@/lib/festival-idioma-servidor';

/** Foto de fondo mientras no se cargue un banner desde el panel. */
const BANNER_POR_DEFECTO = '/blur/hero-cabina.jpg';

/**
 * Home de BLUR. Arranca con el hero a pantalla completa —la foto a sangre tal
 * cual, sin filtros, el logo primario de la diseñadora encima, el lema debajo y una franja con la
 * fecha, el horario y el lugar. Todos los textos salen del panel— y scrollea por un adelanto de algunas
 * secciones (pedido del equipo): las fotos (las de Locación y las extra del
 * home), la Visión y el line-up, cada una con su link a la página entera.
 *
 * La foto del hero va `fixed`: las secciones de abajo tienen fondo propio y
 * suben por encima de ella al scrollear.
 */
export default async function FestivalHome() {
  const [config, lineup, { t }] = await Promise.all([leerConfig(), leerLineup(), leerTextos()]);
  if (!config) notFound();

  const fecha = [fechaCorta(config.fecha), config.horario].filter(Boolean).join(' — ');
  const fotos = [...config.locacion_fotos, ...config.home_fotos];

  return (
    <>
    {/* Alto de pantalla menos el menú, que en el celular ocupa dos o tres renglones. */}
    <section className="relative [clip-path:inset(0)] min-h-[calc(100svh-6rem)] sm:min-h-[calc(100svh-3.25rem)] flex flex-col items-center justify-center text-center">
      {/* `fill` pone la foto en absolute: el `fixed` lo lleva el contenedor. El `clip-path` de la
          sección recorta la foto a su propia caja: con el scroll rápido el navegador pinta la capa
          fija antes que las secciones de abajo y la foto se asomaba por ahí. */}
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
      {/* Degradés para que se lean el menú de arriba y la franja de abajo sin filtrar la foto. */}
      <div aria-hidden className="absolute inset-0 z-[1] pointer-events-none bg-[linear-gradient(to_bottom,transparent_60%,rgba(13,46,19,0.88))]" />
      <Image
        aria-hidden
        src="/blur/marca/textura_1_color.svg"
        alt=""
        width={900}
        height={800}
        unoptimized
        className="absolute z-[2] pointer-events-none right-[-4%] top-[4%] w-[62%] sm:w-[40%] max-w-[640px] h-auto"
      />
      <div className="relative z-10 px-4 pb-[12svh] w-full flex flex-col items-center gap-5 sm:gap-6 fest-entra">
        <LogoBlur className="w-[86vw] sm:w-[min(72vw,1000px)] h-auto" />
        {config.lema && (
          <p className="fest-mono text-[clamp(11px,1.3vw,17px)] uppercase tracking-[0.3em] text-white">{config.lema}</p>
        )}
      </div>

      <div className="absolute z-10 inset-x-0 bottom-0 px-4 sm:px-7 pb-5 flex items-end justify-between gap-4 fest-mono text-[11px] sm:text-[12px] leading-[1.25] uppercase text-white">
        <b className="font-sans font-black normal-case tracking-[-0.02em] text-[15px]">manso club</b>
        {(fecha || config.lugar) && (
          <p className="text-right">
            {fecha}
            {fecha && config.lugar && <br />}
            {config.lugar}
          </p>
        )}
      </div>
    </section>

    {fotos.length > 0 && (
      <Seccion rotulo={t.home.locacion} href="/blur/locacion" ver={t.home.verLocacion}>
        <GaleriaLocacion fotos={fotos} alt={config.lugar ?? t.home.fotosAlt} />
      </Seccion>
    )}

    {config.vision && (
      <Seccion rotulo={t.home.vision}>
        <TextoResaltado
          texto={config.vision}
          className="text-[clamp(17px,1.6vw,24px)] leading-[1.4] tracking-[-0.01em]"
        />
      </Seccion>
    )}

    {lineup.length > 0 && (
      <Seccion rotulo={t.home.lineup} href="/blur/line-up" ver={t.home.verLineup}>
        <LineupCorrido escenarios={lineup} />
      </Seccion>
    )}
    </>
  );
}

/**
 * Un adelanto de sección: rótulo, contenido y el link a la página entera.
 * Sin `href` no hay link ni aire abajo (Visión ya se muestra completa, y así
 * la sección siguiente queda más cerca del texto).
 */
function Seccion({
  rotulo,
  href,
  ver,
  children,
}: {
  rotulo: string;
  href?: string;
  ver?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`relative z-10 bg-[var(--fest-fondo)] fest-fondo px-4 sm:px-7 pt-14 sm:pt-20 ${href ? 'pb-6 sm:pb-10' : ''}`}>
      <p className="fest-rotulo mb-8">
        <EscribeTexto texto={rotulo} />
      </p>
      {children}
      {href && (
        <Link
          href={href}
          className="fest-chevron fest-menu inline-block mt-8 sm:mt-10 text-[16px] sm:text-[18px] text-[var(--fest-acento)] hover:text-[var(--fest-texto)] transition-colors"
        >
          {ver}
        </Link>
      )}
    </section>
  );
}
