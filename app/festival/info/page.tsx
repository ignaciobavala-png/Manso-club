import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { leerConfig, leerFaq } from '@/lib/festival';
import { Escribe, EscribeTexto } from '@/components/festival/Escribe';

export const metadata: Metadata = { title: 'Info & FAQ' };

/** Preguntas frecuentes en tres columnas, como "Info & FAQ" de Basilar. */
export default async function FestivalInfo() {
  const [config, faq] = await Promise.all([leerConfig(), leerFaq()]);
  if (!config) notFound();

  return (
    <div className="px-4 sm:px-7 pt-6 sm:pt-10 pb-20 sm:pb-24 fest-entra">
      {faq.length === 0 ? (
        <>
          <p className="fest-rotulo mb-8">
            <EscribeTexto texto="Info & FAQ" />
          </p>
          <p className="fest-mono text-sm opacity-60">Muy pronto.</p>
        </>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 [column-gap:56px]">
          {faq.map(p => (
            <article key={p.id} className="break-inside-avoid mb-8">
              <h2 className="fest-angosta text-2xl leading-none mb-2">
                <EscribeTexto texto={p.titulo} ritmo={35} />
              </h2>
              <p className="text-[15px] leading-[1.55] opacity-80 whitespace-pre-line">
                <Escribe parrafos={[[{ texto: p.texto }]]} ritmo={12} maximo={1500} retraso={300} />
              </p>
            </article>
          ))}
        </div>
      )}
      {config.email && faq.length > 0 && (
        <p className="mt-6 fest-mono text-[11px] uppercase tracking-[0.25em] opacity-60">
          ¿Otra duda?{' '}
          <a href={`mailto:${config.email}`} className="text-[var(--fest-acento)] normal-case tracking-normal">
            {config.email}
          </a>
        </p>
      )}
    </div>
  );
}
