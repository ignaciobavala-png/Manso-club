import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { leerConfig, leerEntradas } from '@/lib/festival';
import { mediosDePago } from '@/lib/festival-compra';
import { TablaTickets } from '@/components/festival/TablaTickets';

export const metadata: Metadata = { title: 'Tickets' };

export default async function FestivalTickets() {
  const [config, entradas] = await Promise.all([leerConfig(), leerEntradas()]);
  if (!config) notFound();
  const medios = await mediosDePago(config);

  return (
    <div className="px-4 sm:px-7 pt-6 sm:pt-10 pb-20 sm:pb-24 fest-entra">
      <p className="fest-rotulo mb-8">Tickets</p>
      <TablaTickets entradas={entradas} aviso={config.aviso} medios={medios} />
    </div>
  );
}
