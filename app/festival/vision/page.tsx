import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { leerConfig } from '@/lib/festival';
import { TextoResaltado } from '@/components/festival/TextoResaltado';
import { EscribeTexto } from '@/components/festival/Escribe';

export const metadata: Metadata = { title: 'Visión' };

/**
 * Texto corrido con palabras en color, como la página "Vision" de Basilar. Va
 * a todo el ancho (sin tope de caracteres) por pedido del equipo.
 */
export default async function FestivalVision() {
  const config = await leerConfig();
  if (!config) notFound();

  return (
    <div className="px-4 sm:px-7 pt-6 sm:pt-10 pb-20 sm:pb-24 fest-entra">
      <p className="fest-rotulo mb-8">
        <EscribeTexto texto="Visión" />
      </p>
      {config.vision ? (
        <TextoResaltado
          texto={config.vision}
          className="text-[clamp(17px,1.6vw,24px)] leading-[1.4] tracking-[-0.01em]"
        />
      ) : (
        <p className="fest-mono text-sm opacity-60">Muy pronto.</p>
      )}
    </div>
  );
}
