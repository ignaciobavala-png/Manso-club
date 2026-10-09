import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { RedCripto } from '@/lib/cripto-redes';
import {
  adminFestival,
  codigoVisible,
  confirmarPagoMP,
  contenidoQr,
  estadoPublico,
  leerOrden,
  leerTickets,
  linkPagoMP,
  nombreTicket,
  type OrdenFestival,
} from '@/lib/festival-compra';
import { datosParaTransferencia, getBankConfig } from '@/lib/getBankConfig';
import { createSupabaseAnon } from '@/lib/supabase';
import { WHATSAPP_NUMBER } from '@/lib/constants';
import { formatArs, formatUsd } from '@/lib/precios';
import { PagoCripto } from '@/components/festival/PagoCripto';
import { EsperandoMP, PagoTransferencia } from '@/components/festival/PagoPesos';
import { CompraPagada, Dato, Marco, qrDeEntrada } from '@/components/festival/CompraPagada';

export const metadata: Metadata = { title: 'Tu compra', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Una compra del festival. El id de la orden (UUID) es la llave: es el link
 * que se abre después de COMPRAR (o al volver de Mercado Pago) y el que llega
 * por mail, como un link de Passline. Sin pagar muestra cómo pagar según el
 * medio; pagada, un QR por entrada.
 */
export default async function CompraFestival({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!UUID.test(id)) notFound();

  const supabase = adminFestival();
  let orden = await leerOrden(supabase, id);
  if (!orden) notFound();

  // Vuelta de Mercado Pago: se confirma con el `payment_id` sin esperar al
  // webhook. `confirmarPagoMP` lee el pago de MP, no le cree a la URL.
  if (orden.metodo === 'mercadopago' && orden.estado !== 'pagada' && /^\d+$/.test(query.payment_id ?? '')) {
    try {
      orden = (await confirmarPagoMP(supabase, query.payment_id!)) ?? orden;
    } catch (e) {
      console.error(`No se pudo leer el pago de MP ${query.payment_id}:`, e);
    }
  }

  const resumen = (
    <dl className="mt-12 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 fest-mono text-[13px] max-w-[620px]">
      <Dato titulo="A nombre de">{orden.nombre}</Dato>
      <Dato titulo="Entradas">{orden.items.map(i => `${i.cantidad} × ${i.nombre}`).join(' · ')}</Dato>
      <Dato titulo="Total">
        {orden.metodo === 'cripto' && orden.total_usd !== null ? (
          <>
            {formatUsd(orden.total_usd)} <span className="opacity-55">({formatArs(orden.total_ars)} al blue)</span>
          </>
        ) : (
          formatArs(orden.total_ars)
        )}
      </Dato>
    </dl>
  );

  if (orden.estado !== 'pagada') {
    return (
      <Marco>
        <PagoPendiente orden={orden} rechazado={query.status === 'rejected' || query.collection_status === 'rejected'} />
        {resumen}
      </Marco>
    );
  }

  const [filas, { data: pago }] = await Promise.all([
    leerTickets(supabase, id),
    supabase.from('festival_cripto_pagos').select('red, token, monto, tx_hash').eq('orden_id', id).maybeSingle(),
  ]);
  const tickets = await Promise.all(
    filas.map(async t => ({
      id: t.id,
      entrada_nombre: nombreTicket(t),
      codigo: codigoVisible(t),
      usado: t.usado,
      qr: await qrDeEntrada(contenidoQr(t)),
    }))
  );

  return (
    <Marco>
      <CompraPagada
        email={orden.email}
        tickets={tickets}
        pago={pago ? { ...pago, red: pago.red as RedCripto, monto: Number(pago.monto) } : null}
        medio={orden.metodo === 'mercadopago' ? 'Mercado Pago' : orden.metodo === 'transferencia' ? 'transferencia' : undefined}
      >
        {resumen}
      </CompraPagada>
    </Marco>
  );
}

async function PagoPendiente({ orden, rechazado }: { orden: OrdenFestival; rechazado: boolean }) {
  if (orden.metodo === 'mercadopago') {
    return <EsperandoMP link={await linkPagoMP(orden)} rechazado={rechazado} />;
  }

  if (orden.metodo === 'transferencia') {
    const { data } = await createSupabaseAnon()
      .from('checkout_config')
      .select('value')
      .eq('key', 'whatsapp_numero')
      .maybeSingle();
    const whatsapp = (data?.value as string | undefined)?.replace(/\D/g, '') || WHATSAPP_NUMBER;
    return (
      <PagoTransferencia
        codigo={orden.id.slice(0, 8).toUpperCase()}
        totalArs={orden.total_ars}
        datos={datosParaTransferencia(await getBankConfig())}
        whatsapp={whatsapp}
      />
    );
  }

  return <PagoCripto ordenId={orden.id} inicial={estadoPublico(orden)} />;
}
