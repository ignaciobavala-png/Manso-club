import { NextRequest, NextResponse } from 'next/server';
import { adminFestival, confirmarPagoMP } from '@/lib/festival-compra';

/**
 * Avisos de Mercado Pago de las compras del festival (`notification_url` de
 * cada preferencia). No verifica la firma: el aviso solo trae un id de pago y
 * `confirmarPagoMP` lo lee de la API de MP con nuestro token, así que un aviso
 * inventado no puede acreditar nada que MP no haya cobrado.
 *
 * MP manda el id en el cuerpo (`data.id`, webhooks) o en la URL (`data.id` o
 * `id` con `topic=payment`, el formato viejo de IPN).
 */
export async function POST(request: NextRequest) {
  const url = request.nextUrl.searchParams;
  const body = (await request.json().catch(() => ({}))) as { type?: string; data?: { id?: string | number } };

  const tipo = body.type ?? url.get('type') ?? url.get('topic');
  const paymentId = String(body.data?.id ?? url.get('data.id') ?? url.get('id') ?? '');
  if (tipo !== 'payment' || !/^\d+$/.test(paymentId)) return NextResponse.json({ received: true });

  try {
    await confirmarPagoMP(adminFestival(), paymentId);
    return NextResponse.json({ received: true });
  } catch (e) {
    // 500 para que MP reintente más tarde.
    console.error(`Webhook MP del festival, pago ${paymentId}:`, e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
