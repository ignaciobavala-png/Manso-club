import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { leerConfig, leerLineup } from '@/lib/festival';
import { LineupCorrido } from '@/components/festival/LineupCorrido';
import { leerTextos } from '@/lib/festival-idioma-servidor';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await leerTextos();
  return { title: t.lineup.titulo };
}

/**
 * El line-up entero, igual que el adelanto del home (`LineupCorrido`). Sin el
 * rótulo "Line up" arriba: el menú ya dice dónde estás y repetía.
 */
export default async function FestivalLineup() {
  const [config, lineup, { t }] = await Promise.all([leerConfig(), leerLineup(), leerTextos()]);
  if (!config) notFound();

  return (
    <div className="px-4 sm:px-7 pt-6 sm:pt-10 pb-20 sm:pb-24 fest-entra">
      {lineup.length === 0 ? (
        <p className="fest-mono text-sm opacity-60">{t.lineup.pronto}</p>
      ) : (
        <LineupCorrido escenarios={lineup} />
      )}
    </div>
  );
}
