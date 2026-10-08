import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fechaCorta, leerConfig } from '@/lib/festival';
import { GaleriaLocacion } from '@/components/festival/GaleriaLocacion';
import { EscribeTexto } from '@/components/festival/Escribe';

export const metadata: Metadata = { title: 'Locación' };

/**
 * Como la página "Location" de Basilar, pero sin el texto grande: los datos
 * duros en una barra y abajo la galería de fotos en mosaico. El texto del panel
 * (`config.locacion`) se sacó a pedido del equipo porque repetía la barra.
 */
export default async function FestivalLocacion() {
  const config = await leerConfig();
  if (!config) notFound();

  const fecha = fechaCorta(config.fecha);
  const datos = [
    ['Dónde', [config.lugar, config.direccion].filter(Boolean).join(', ')],
    ['Cuándo', fecha],
    ['Horario', config.horario],
  ].filter((d): d is [string, string] => Boolean(d[1]));

  return (
    <div className="px-4 sm:px-7 pt-6 sm:pt-10 pb-20 sm:pb-24 fest-entra">
      <p className="fest-rotulo mb-8">
        <EscribeTexto texto="Locación" />
      </p>

      {datos.length > 0 ? (
        <dl className="max-w-4xl grid sm:grid-cols-3 border-t border-[var(--fest-texto)]/15">
          {datos.map(([etiqueta, valor]) => (
            <div key={etiqueta} className="py-4 pr-4 border-b border-[var(--fest-texto)]/15">
              <dt className="fest-mono text-[10px] uppercase tracking-[0.3em] opacity-55 mb-1.5">{etiqueta}</dt>
              <dd className="fest-angosta text-[22px] leading-tight">{valor}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="fest-mono text-sm opacity-60">La locación se anuncia pronto.</p>
      )}

      {config.locacion_fotos.length > 0 && (
        <div className="mt-12 sm:mt-16">
          <GaleriaLocacion fotos={config.locacion_fotos} alt={config.lugar ?? 'Locación del festival'} />
        </div>
      )}
    </div>
  );
}
