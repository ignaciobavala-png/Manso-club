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
 * qué es BLUR, áreas, beneficios, a quién buscamos, fecha y compromiso, cómo
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

  // Líneas de "Fecha, lugar y compromiso": las que tienen dato cargado.
  const compromiso = [
    t.compromiso.fecha,
    vol.turnos && llenar(t.compromiso.turnos, { valor: vol.turnos }),
    vol.montaje && llenar(t.compromiso.montaje, { valor: vol.montaje }),
    vol.desmontaje && llenar(t.compromiso.desmontaje, { valor: vol.desmontaje }),
    vol.traslado && llenar(t.compromiso.traslado, { valor: vol.traslado }),
    vol.induccion && llenar(t.compromiso.induccion, { valor: vol.induccion }),
  ].filter(Boolean) as string[];

  // Requisitos: la edad sale del panel; la inducción solo si se cargó la fecha/formato.
  const requisitos = [
    llenar(t.quien.edad, { edad: vol.edad_minima }),
    t.quien.isla,
    vol.induccion ? t.quien.induccion : null,
  ].filter(Boolean) as string[];

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

      {/* 2. Qué es BLUR + 3. Áreas */}
      <SeccionMarca tema="gris" deco={DECO.locacion} className={`${SECCION} pb-24 sm:pb-28`}>
        <div className="max-w-[1100px] space-y-14 sm:space-y-20">
          <div>
            <p className={ROTULO}>{t.que.rotulo}</p>
            <p className="text-[clamp(17px,1.6vw,24px)] leading-[1.4] tracking-[-0.01em] max-w-[780px]">{t.que.texto}</p>
          </div>

          <div id="areas" className={ANCLA}>
            <p className={ROTULO}>{t.areas.rotulo}</p>
            <div className="grid gap-4 md:grid-cols-3">
              {t.areas.items.map(a => (
                <article key={a.valor} className="border border-[var(--fest-texto)]/40 p-5 flex flex-col gap-3 bg-[var(--fest-fondo)]/60">
                  <h2 className="fest-angosta text-[26px] leading-[1.05]">{a.valor}</h2>
                  <p className="text-[15px] leading-[1.5]">{a.descripcion}</p>
                  <p className="text-[14px] leading-[1.45] mt-auto pt-3 border-t border-[var(--fest-texto)]/25">
                    <b className="fest-mono text-[11px] uppercase tracking-[0.2em] text-[var(--fest-resalte)]">{t.areas.ideal}</b>{' '}
                    {a.ideal}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </SeccionMarca>

      {/* 4. Beneficios */}
      <SeccionMarca tema="naranja" deco={DECO.spots} className={`${SECCION} pb-24 sm:pb-28`}>
        <div id="beneficios" className={`${ANCLA} max-w-[1100px]`}>
          <p className={ROTULO}>{t.beneficios.rotulo}</p>
          <ul className="grid gap-x-8 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
            {t.beneficios.items.map((b, i) => (
              <li
                key={b}
                className={`flex gap-3 py-4 border-t border-[var(--fest-texto)]/40 text-[16px] leading-[1.35] ${
                  // Los dos primeros, destacados.
                  i < 2 ? 'font-bold text-[18px]' : ''
                }`}
              >
                <span aria-hidden className="fest-mono text-[12px] pt-[3px] opacity-70">{String(i + 1).padStart(2, '0')}</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </SeccionMarca>

      {/* 5. A quién buscamos + 6. Fecha, lugar y compromiso + 7. Cómo funciona */}
      <SeccionMarca tema="crema" deco={DECO.info} className={`${SECCION} pb-[60vw] sm:pb-[22vw]`}>
        <div className="max-w-[1100px] space-y-14 sm:space-y-20">
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <div>
              <p className={ROTULO}>{t.quien.rotulo}</p>
              <p className="text-[18px] leading-[1.45] mb-5">{t.quien.texto}</p>
              <ul className="space-y-2 text-[16px] leading-[1.4]">
                {requisitos.map(r => (
                  <li key={r} className="flex gap-3">
                    <span aria-hidden className="text-[var(--fest-acento)] font-bold">›</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className={ROTULO}>{t.compromiso.rotulo}</p>
              <ul className="space-y-2 text-[16px] leading-[1.4]">
                {compromiso.map(c => (
                  <li key={c} className="flex gap-3">
                    <span aria-hidden className="text-[var(--fest-acento)] font-bold">›</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <p className={ROTULO}>{t.pasos.rotulo}</p>
            <ol className="grid gap-4 sm:grid-cols-4">
              {t.pasos.items.map((paso, i) => (
                <li key={paso} className="border-t border-[var(--fest-texto)]/40 pt-3">
                  <span className="fest-angosta text-[44px] leading-none text-[var(--fest-acento)] block mb-2">{i + 1}</span>
                  <span className="text-[15px] leading-[1.4]">{paso}</span>
                </li>
              ))}
            </ol>
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
