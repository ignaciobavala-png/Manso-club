import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { leerConfig } from '@/lib/festival';
import { TextoResaltado } from '@/components/festival/TextoResaltado';

export const metadata: Metadata = { title: 'Visión' };

/** Texto corrido con palabras en color, como la página "Vision" de Basilar. */
export default async function FestivalVision() {
  const config = await leerConfig();
  if (!config) notFound();

  return (
    <div className="px-4 sm:px-7 pt-6 sm:pt-10 pb-20 sm:pb-24 fest-entra">
      <p className="fest-rotulo mb-8">Visión</p>
      {config.vision ? (
        <TextoResaltado
          texto={config.vision}
          className="max-w-[46ch] text-[clamp(19px,1.9vw,28px)] leading-[1.38] tracking-[-0.01em]"
        />
      ) : (
        <p className="fest-mono text-sm opacity-60">Muy pronto.</p>
      )}
    </div>
  );
}
