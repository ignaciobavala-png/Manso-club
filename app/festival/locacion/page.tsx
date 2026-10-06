import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fechaCorta, leerConfig } from '@/lib/festival';
import { TextoResaltado } from '@/components/festival/TextoResaltado';
import { FotoRevelada } from '@/components/festival/FotoRevelada';

export const metadata: Metadata = { title: 'Locación' };

/** Texto del panel, los datos duros en una grilla y la foto con marco revelado. */
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
      <p className="fest-rotulo mb-8">Locación</p>

      <div className={`grid gap-9 md:gap-14 items-start ${config.foto_url ? 'md:grid-cols-[1.1fr_0.9fr]' : ''}`}>
        <div>
          {config.locacion ? (
            <TextoResaltado
              texto={config.locacion}
              className="max-w-[46ch] text-[clamp(19px,1.9vw,28px)] leading-[1.38] tracking-[-0.01em]"
            />
          ) : (
            <p className="fest-mono text-sm opacity-60">La locación se anuncia pronto.</p>
          )}

          {datos.length > 0 && (
            <dl className="mt-10 grid sm:grid-cols-3 border-t border-[var(--fest-texto)]/15">
              {datos.map(([etiqueta, valor]) => (
                <div key={etiqueta} className="py-4 pr-4 border-b border-[var(--fest-texto)]/15">
                  <dt className="fest-mono text-[10px] uppercase tracking-[0.3em] opacity-55 mb-1.5">{etiqueta}</dt>
                  <dd className="fest-angosta text-[22px] leading-tight">{valor}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {config.foto_url && (
          <FotoRevelada
            src={config.foto_url}
            alt={config.lugar ?? ''}
            pie={[config.direccion || config.lugar, fecha].filter(Boolean).join(' — ')}
          />
        )}
      </div>
    </div>
  );
}
