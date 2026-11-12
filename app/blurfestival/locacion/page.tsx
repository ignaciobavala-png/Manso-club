import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fechaCorta, leerConfig } from '@/lib/festival';
import { GaleriaLocacion } from '@/components/festival/GaleriaLocacion';
import { EscribeTexto } from '@/components/festival/Escribe';
import { DECO, SeccionMarca } from '@/components/festival/SeccionMarca';
import { MARCA_SEO, resumenFestival } from '@/lib/festival-seo';
import { descripcion } from '@/lib/seo';
import { leerTextos } from '@/lib/festival-idioma-servidor';

export async function generateMetadata(): Promise<Metadata> {
  const [{ t }, config] = await Promise.all([leerTextos(), leerConfig()]);
  if (!config) return { title: t.locacion.titulo };
  return { title: t.locacion.titulo, description: descripcion(`Cómo llegar a ${MARCA_SEO} Festival en Manso Club${config.lugar ? `, ${config.lugar}` : ''}. ${resumenFestival(config)}`) };
}

/**
 * Como la página "Location" de Basilar, pero sin el texto grande: los datos
 * duros en una barra y abajo la galería de fotos en mosaico. El texto del panel
 * (`config.locacion`) se sacó a pedido del equipo porque repetía la barra.
 */
export default async function FestivalLocacion() {
  const [config, { t }] = await Promise.all([leerConfig(), leerTextos()]);
  if (!config) notFound();

  const fecha = fechaCorta(config.fecha);
  const datos = [
    [t.locacion.donde, [config.lugar, config.direccion].filter(Boolean).join(', ')],
    [t.locacion.cuando, fecha],
    [t.locacion.horario, config.horario],
  ].filter((d): d is [string, string] => Boolean(d[1]));

  return (
    <SeccionMarca
      tema="gris"
      deco={DECO.locacion}
      className="flex-1 px-4 sm:px-7 pt-6 sm:pt-10 pb-20 sm:pb-24 fest-entra"
    >
      <p className="fest-rotulo mb-8">
        <EscribeTexto texto={t.locacion.titulo} />
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
        <p className="fest-mono text-sm opacity-60">{t.locacion.pronto}</p>
      )}

      {config.locacion_fotos.length > 0 && (
        <div className="mt-12 sm:mt-16">
          <GaleriaLocacion fotos={config.locacion_fotos} alt={config.lugar ?? t.locacion.alt} />
        </div>
      )}
    </SeccionMarca>
  );
}
