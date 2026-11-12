import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { leerConfig, leerFaq } from '@/lib/festival';
import { DECO, SeccionMarca } from '@/components/festival/SeccionMarca';
import { MARCA_SEO, resumenFestival } from '@/lib/festival-seo';
import { descripcion } from '@/lib/seo';
import { leerTextos } from '@/lib/festival-idioma-servidor';
import { JsonLd } from '@/components/SEO/JsonLd';

export async function generateMetadata(): Promise<Metadata> {
  const [{ t }, config] = await Promise.all([leerTextos(), leerConfig()]);
  if (!config) return { title: t.info.titulo };
  return { title: t.info.titulo, description: descripcion(`Preguntas frecuentes de ${MARCA_SEO}: entradas, horarios, cómo llegar y todo lo que tenés que saber. ${resumenFestival(config)}`) };
}

/** Preguntas frecuentes en tres columnas, como "Info & FAQ" de Basilar. */
export default async function FestivalInfo() {
  const [config, faq, { t }] = await Promise.all([leerConfig(), leerFaq(), leerTextos()]);
  if (!config) notFound();

  return (
    <>
    {faq.length > 0 && (
      <JsonLd
        data={{
          '@type': 'FAQPage',
          mainEntity: faq.map(p => ({
            '@type': 'Question',
            name: p.titulo,
            acceptedAnswer: { '@type': 'Answer', text: p.texto },
          })),
        }}
      />
    )}
    <SeccionMarca
      tema="rosa"
      deco={DECO.info}
      className="flex-1 px-4 sm:px-7 pt-6 sm:pt-10 pb-20 sm:pb-24 fest-entra pb-[55vw] sm:pb-[20vw]"
    >
      {faq.length === 0 ? (
        <>
          <p className="fest-rotulo mb-8">
            {t.info.titulo}
          </p>
          <p className="fest-mono text-sm opacity-60">{t.muyPronto}</p>
        </>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 [column-gap:56px]">
          {faq.map(p => (
            <article key={p.id} className="break-inside-avoid mb-8">
              <h2 className="fest-angosta text-2xl leading-none mb-2">
                {p.titulo}
              </h2>
              <p className="text-[15px] leading-[1.55] opacity-80 whitespace-pre-line">
                {p.texto}
              </p>
            </article>
          ))}
        </div>
      )}
      {config.email && faq.length > 0 && (
        <p className="mt-6 fest-mono text-[11px] uppercase tracking-[0.25em] opacity-60">
          {t.info.otraDuda}{' '}
          <a href={`mailto:${config.email}`} className="text-[var(--fest-acento)] normal-case tracking-normal">
            {config.email}
          </a>
        </p>
      )}
    </SeccionMarca>
    </>
  );
}
