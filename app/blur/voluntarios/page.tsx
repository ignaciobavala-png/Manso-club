import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { leerConfig } from '@/lib/festival';
import { leerTextos } from '@/lib/festival-idioma-servidor';
import { convocatoriaAbierta } from '@/lib/festival-voluntarios';
import { leerConfigVoluntarios } from '@/lib/festival-voluntarios-servidor';
import { TEXTOS_VOLUNTARIOS, llenar } from '@/lib/festival-voluntarios-textos';
import { DECO, SeccionMarca } from '@/components/festival/SeccionMarca';
import { VoluntariosForm } from '@/components/festival/VoluntariosForm';
import { VoluntariosCerrada } from '@/components/festival/VoluntariosCerrada';
import { BotonFlotanteVoluntarios } from '@/components/festival/BotonFlotanteVoluntarios';

export async function generateMetadata(): Promise<Metadata> {
  const { idioma } = await leerTextos();
  const v = TEXTOS_VOLUNTARIOS[idioma];
  // El layout ya manda `noindex` mientras el festival no se lance en serio.
  return { title: v.metaTitulo, description: v.metaDescripcion, openGraph: { title: v.metaTitulo, description: v.metaDescripcion } };
}

const ROTULO = 'fest-rotulo mb-6';
const SECCION = 'px-4 sm:px-7 py-14 sm:py-20';
/** Debajo del menú pegajoso del escritorio. */
const ANCLA = 'scroll-mt-16';

/**
 * /blur/voluntarios — una sola página, corta y directa (brief del 04/11): hero,
 * qué es BLUR, áreas, beneficios, a quién buscamos, cómo
 * funciona, formulario y FAQ. Los textos finales del brief están en
 * `festival-voluntarios-textos`; los datos que quedaron "A DEFINIR" (turnos,
 * montaje, traslado, inducción, edad) salen del panel y, vacíos, no se
 * muestran: la página no sale con huecos tipo "Turnos de [X] horas".
 */
export default async function FestivalVoluntarios() {
  const [config, vol, { idioma }] = await Promise.all([leerConfig(), leerConfigVoluntarios(), leerTextos()]);
  if (!config) notFound();

  const t = TEXTOS_VOLUNTARIOS[idioma];
  const abierta = convocatoriaAbierta(vol);
  const instagram = config.instagram?.replace(/^@/, '') ?? 'blur.festival';
  const contacto = config.email ?? '';

  // Requisitos: la inducción solo si se cargó la fecha/formato.
  const requisitos = [vol.induccion ? t.quien.induccion : null].filter(Boolean) as string[];

  const faq = [...t.faq.items];
  // "¿Cómo llego?" se suma solo si hay respuesta cargada (en el brief estaba "A DEFINIR").
  if (vol.traslado) faq.splice(4, 0, { p: t.faq.llegar.p, r: llenar(t.faq.llegar.r, { valor: vol.traslado }) });

  return (
    <>
      <BotonFlotanteVoluntarios />

      {/* 1. Hero */}
      <SeccionMarca tema="verde" deco={DECO.vision} className={`${SECCION} pb-[58vw] sm:pb-[18vw] fest-entra`}>
        <div className="max-w-[820px]">
          <p className={ROTULO}>{t.titulo}</p>
          <h1 className="fest-ancha text-[clamp(38px,8vw,92px)] leading-[0.95] mb-6 text-[var(--fest-resalte)]">
            {t.hero.titulo}
          </h1>
          <p className="fest-mono text-[12px] sm:text-[13px] uppercase tracking-[0.2em] mb-5">{t.hero.bajada}</p>
          <p className="text-[clamp(17px,1.6vw,22px)] leading-[1.4] mb-8 max-w-[560px]">{t.hero.texto}</p>
          <a
            href="#formulario"
            className="fest-menu inline-block text-[19px] bg-[var(--fest-acento)] text-[var(--fest-fondo)] hover:bg-[var(--fest-texto)] transition-colors px-6 py-3"
          >
            {t.hero.boton}
          </a>
        </div>
      </SeccionMarca>

      {/* 2. Qué es BLUR */}
      <SeccionMarca tema="gris" deco={DECO.locacion} className={`${SECCION} pb-24 sm:pb-28`}>
        <div className="max-w-[1100px]">
          <p className={ROTULO}>{t.que.rotulo}</p>
          <p className="text-[clamp(17px,1.6vw,24px)] leading-[1.4] tracking-[-0.01em] max-w-[780px]">{t.que.texto}</p>
        </div>
      </SeccionMarca>

      {/* 3. Qué ofrecemos: va antes que cualquier tarea. La entrada gratis es la moneda de cambio. */}
      <SeccionMarca tema="naranja" deco={DECO.spots} className={`${SECCION} pb-24 sm:pb-32`}>
        <div id="beneficios" className={`${ANCLA} max-w-[1100px]`}>
          <h2 className="fest-ancha text-[clamp(44px,10vw,128px)] leading-[0.9] mb-10 sm:mb-14">{t.beneficios.rotulo}</h2>
          <div className="border-y-2 border-[var(--fest-texto)] py-8 sm:py-12 mb-10 sm:mb-14">
            <p className="fest-ancha text-[clamp(34px,7vw,88px)] leading-[0.95] mb-4">{t.beneficios.destacado.titulo}</p>
            <p className="text-[clamp(18px,2vw,28px)] leading-[1.3] max-w-[640px]">{t.beneficios.destacado.texto}</p>
          </div>
          <ul className="grid gap-x-8 sm:grid-cols-2">
            {t.beneficios.items.map((b, i) => (
              <li
                key={b}
                className="flex gap-3 py-4 border-t border-[var(--fest-texto)]/40 text-[clamp(17px,1.5vw,21px)] font-bold leading-[1.3]"
              >
                <span aria-hidden className="fest-mono text-[12px] pt-[5px] opacity-70">{String(i + 1).padStart(2, '0')}</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </SeccionMarca>

      {/* 4. A quién buscamos */}
      <SeccionMarca tema="crema" deco={DECO.info} className={`${SECCION} pb-24 sm:pb-28`}>
        <div className="max-w-[1100px]">
          <div>
            <p className={ROTULO}>{t.quien.rotulo}</p>
            <p className="text-[18px] leading-[1.45] mb-5">{t.quien.texto}</p>
            {requisitos.length > 0 && <ul className="space-y-2 text-[16px] leading-[1.4]">
              {requisitos.map(r => (
                <li key={r} className="flex gap-3">
                  <span aria-hidden className="text-[var(--fest-acento)] font-bold">›</span>
                  {r}
                </li>
              ))}
            </ul>}
          </div>
        </div>
      </SeccionMarca>

      {/* 5. En qué vas a participar */}
      <SeccionMarca tema="gris" deco={DECO.vision} className={`${SECCION} pb-[60vw] sm:pb-[22vw]`}>
        <div id="areas" className={`${ANCLA} max-w-[1100px]`}>
          <p className={ROTULO}>{t.areas.rotulo}</p>
          <div className="grid gap-4 md:grid-cols-3">
            {t.areas.items.map(a => (
              <article key={a.valor} className="border border-[var(--fest-texto)]/40 p-5 flex flex-col gap-3 bg-[var(--fest-fondo)]/60">
                <h2 className="fest-angosta text-[26px] leading-[1.05]">{a.valor}</h2>
                <p className="text-[15px] leading-[1.5]">{a.descripcion}</p>
              </article>
            ))}
          </div>
        </div>
      </SeccionMarca>

      {/* 8. Formulario */}
      <SeccionMarca tema="rosa" className={`${SECCION} pb-24 sm:pb-32`}>
        <div id="formulario" className={`${ANCLA} mx-auto w-full max-w-[640px]`}>
          <h2 className="fest-ancha text-[clamp(30px,5vw,52px)] leading-none mb-3">{t.form.titulo}</h2>
          <p className="text-[17px] leading-[1.4] mb-10">{t.form.bajada}</p>
          {abierta ? (
            <VoluntariosForm
              edadMinima={vol.edad_minima}
              disponibilidad={vol.disponibilidad}
              contacto={contacto}
              instagram={instagram}
            />
          ) : (
            <VoluntariosCerrada />
          )}
        </div>
      </SeccionMarca>

      {/* 9. FAQ + 10. Contacto y nota legal */}
      <SeccionMarca tema="verde" className={`${SECCION} pb-24`}>
        <div id="faq" className={`${ANCLA} max-w-[820px]`}>
          <p className={ROTULO}>{t.faq.rotulo}</p>
          <div className="border-b border-[var(--fest-texto)]/40">
            {faq.map(({ p, r }) => (
              // <details> trae el aria-expanded y el teclado de fábrica, y no pesa en JS.
              <details key={p} className="group border-t border-[var(--fest-texto)]/40">
                <summary className="flex items-center justify-between gap-4 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-[17px] font-bold">
                  {p}
                  <span aria-hidden className="fest-mono text-[20px] text-[var(--fest-acento)] group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="pb-5 text-[16px] leading-[1.5] opacity-85 max-w-[640px]">{r}</p>
              </details>
            ))}
          </div>

          <p className="mt-10 text-[16px] leading-[1.5]">
            {t.contacto.dudas}{' '}
            <a
              href={`https://instagram.com/${instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--fest-acento)] underline underline-offset-2"
            >
              @{instagram}
            </a>
            {contacto && (
              <>
                {' '}{t.contacto.o}{' '}
                <a href={`mailto:${contacto}`} className="text-[var(--fest-acento)] underline underline-offset-2">
                  {contacto}
                </a>
              </>
            )}
          </p>
          <p className="mt-4 fest-mono text-[11px] uppercase tracking-[0.2em] opacity-60">{t.contacto.legal}</p>
        </div>
      </SeccionMarca>
    </>
  );
}
