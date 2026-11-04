import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { leerConfig, leerEntradas } from '@/lib/festival';
import { mediosDePago } from '@/lib/festival-compra';
import { urlTransferenciaGestion } from '@/lib/gestion-entradas';
import { getCotizacionDolar } from '@/lib/dolar';
import { TablaTickets } from '@/components/festival/TablaTickets';
import { EscribeTexto } from '@/components/festival/Escribe';
import { DECO, SeccionMarca } from '@/components/festival/SeccionMarca';
import { leerTextos } from '@/lib/festival-idioma-servidor';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await leerTextos();
  return { title: t.tickets.titulo };
}

export default async function FestivalTickets() {
  const [config, entradas, { t }] = await Promise.all([leerConfig(), leerEntradas(), leerTextos()]);
  if (!config) notFound();
  const medios = await mediosDePago(config);
  // Solo para mostrar "≈ X USDT" antes de pagar; si la API no responde, se omite.
  const cotizacion = medios.includes('cripto') ? await getCotizacionDolar().then(c => c.venta, () => null) : null;

  return (
    <SeccionMarca tema="crema" deco={DECO.tickets} className="flex-1 px-4 sm:px-7 pt-6 sm:pt-10 pb-[34vw] sm:pb-24 fest-entra">
      <div className="w-full max-w-[980px] mx-auto">
        <p className="fest-rotulo mb-8">
          <EscribeTexto texto={t.tickets.titulo} />
        </p>
        <TablaTickets entradas={entradas} aviso={config.aviso} medios={medios} cotizacion={cotizacion} urlTransferencia={urlTransferenciaGestion()} />
      </div>
    </SeccionMarca>
  );
}
