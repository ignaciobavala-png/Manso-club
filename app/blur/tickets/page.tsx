import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { leerConfig, leerEntradas } from '@/lib/festival';
import { mediosDePago } from '@/lib/festival-compra';
import { TablaTickets } from '@/components/festival/TablaTickets';
import { EscribeTexto } from '@/components/festival/Escribe';
import { leerTextos } from '@/lib/festival-idioma-servidor';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await leerTextos();
  return { title: t.tickets.titulo };
}

export default async function FestivalTickets() {
  const [config, entradas, { t }] = await Promise.all([leerConfig(), leerEntradas(), leerTextos()]);
  if (!config) notFound();
  const medios = await mediosDePago(config);

  return (
    <div className="w-full max-w-[980px] mx-auto px-4 sm:px-7 pt-6 sm:pt-10 pb-20 sm:pb-24 fest-entra">
      <p className="fest-rotulo mb-8">
        <EscribeTexto texto={t.tickets.titulo} />
      </p>
      <TablaTickets entradas={entradas} aviso={config.aviso} medios={medios} />
    </div>
  );
}
