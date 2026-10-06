import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { RedCripto } from '@/lib/cripto-redes';
import { adminFestival, estadoPublico, leerOrden, type TicketFestival } from '@/lib/festival-compra';
import { formatArs, formatUsd } from '@/lib/precios';
import { PagoCripto } from '@/components/festival/PagoCripto';
import { CompraPagada, Dato, Marco, qrDeEntrada } from '@/components/festival/CompraPagada';

export const metadata: Metadata = { title: 'Tu compra', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Una compra del festival. El id de la orden (UUID) es la llave: es el link
 * que se abre después de COMPRAR y el que llega por mail, como un link de
 * Passline. Sin pagar muestra la pantalla de pago; pagada, un QR por entrada.
 */
export default async function CompraFestival({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = adminFestival();
  const orden = await leerOrden(supabase, id);
  if (!orden) notFound();

  const resumen = (
    <dl className="mt-12 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 fest-mono text-[13px] max-w-[620px]">
      <Dato titulo="A nombre de">{orden.nombre}</Dato>
      <Dato titulo="Entradas">{orden.items.map(i => `${i.cantidad} × ${i.nombre}`).join(' · ')}</Dato>
      <Dato titulo="Total">
        {formatUsd(orden.total_usd)} <span className="opacity-55">({formatArs(orden.total_ars)} al blue)</span>
      </Dato>
    </dl>
  );

  if (orden.estado !== 'pagada') {
    return (
      <Marco>
        <PagoCripto ordenId={orden.id} inicial={estadoPublico(orden)} />
        {resumen}
      </Marco>
    );
  }

  const [{ data: filas }, { data: pago }] = await Promise.all([
    supabase.from('festival_tickets').select('id, entrada_nombre, codigo, usado').eq('orden_id', id).order('created_at'),
    supabase.from('festival_cripto_pagos').select('red, token, monto, tx_hash').eq('orden_id', id).maybeSingle(),
  ]);
  const tickets = await Promise.all(
    ((filas as TicketFestival[] | null) ?? []).map(async t => ({
      ...t,
      qr: await qrDeEntrada(t.codigo),
    }))
  );

  return (
    <Marco>
      <CompraPagada
        email={orden.email}
        tickets={tickets}
        pago={pago ? { ...pago, red: pago.red as RedCripto, monto: Number(pago.monto) } : null}
      >
        {resumen}
      </CompraPagada>
    </Marco>
  );
}
