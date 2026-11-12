import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { leerConfig, leerLineup } from '@/lib/festival';
import { LineupCorrido } from '@/components/festival/LineupCorrido';
import { DECO, SeccionMarca } from '@/components/festival/SeccionMarca';
import { MARCA_SEO, resumenFestival } from '@/lib/festival-seo';
import { descripcion } from '@/lib/seo';
import { leerTextos } from '@/lib/festival-idioma-servidor';

export async function generateMetadata(): Promise<Metadata> {
  const [{ t }, config] = await Promise.all([leerTextos(), leerConfig()]);
  if (!config) return { title: t.lineup.titulo };
  return { title: t.lineup.titulo, description: descripcion(`Line up de ${MARCA_SEO}: los artistas y DJs que tocan. ${resumenFestival(config)}`) };
}

/**
 * El line-up entero, igual que el adelanto del home (`LineupCorrido`). Sin el
 * rótulo "Line up" arriba: el menú ya dice dónde estás y repetía.
 */
export default async function FestivalLineup() {
  const [config, lineup, { t }] = await Promise.all([leerConfig(), leerLineup(), leerTextos()]);
  if (!config) notFound();

  return (
    <SeccionMarca
      tema="verde"
      deco={DECO.lineup}
      className="flex-1 px-4 sm:px-7 pt-6 sm:pt-10 pb-20 sm:pb-24 fest-entra"
    >
      {lineup.length === 0 ? (
        <p className="fest-mono text-sm opacity-60">{t.lineup.pronto}</p>
      ) : (
        <LineupCorrido escenarios={lineup} />
      )}
    </SeccionMarca>
  );
}
