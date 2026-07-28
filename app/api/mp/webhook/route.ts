import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
import { getMPPaymentClient } from '@/lib/mercadopago';

interface WebhookNotification {
  type: string;
  data: { id: string };
}

function verifySignature(request: NextRequest, dataId: string): boolean {
  const webhookSecret = process.env.MP_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // Sin secreto configurado no podemos confiar en la notificación: se rechaza.
    console.error('❌ MP_WEBHOOK_SECRET no configurado, rechazando webhook');
    return false;
  }

  const xSignature = request.headers.get('x-signature');
  const xRequestId = request.headers.get('x-request-id');
  if (!xSignature || !xRequestId) return false;

  const parts = Object.fromEntries(
    xSignature.split(',').map((p) => {
      const [k, v] = p.split('=');
      return [k.trim(), v?.trim()];
    })
  );
  const ts = parts.ts;
  const hash = parts.v1;
  if (!ts || !hash) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const calculatedHash = createHmac('sha256', webhookSecret).update(manifest).digest('hex');

  return calculatedHash === hash;
}

export async function POST(request: NextRequest) {
  try {
    const body: WebhookNotification = await request.json();

    if (body.type !== 'payment' || !body.data?.id) {
      return NextResponse.json({ received: true });
    }

    if (!verifySignature(request, body.data.id)) {
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
    }

    const paymentClient = getMPPaymentClient();
    const payment = await paymentClient.get({ id: body.data.id });

    const pedidoId = payment.external_reference;
    if (!pedidoId) {
      return NextResponse.json({ received: true });
    }

    const estado =
      payment.status === 'approved'
        ? 'pagado'
        : payment.status === 'rejected'
        ? 'cancelado'
        : 'pendiente_pago';

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase
      .from('pedidos')
      .update({
        mp_payment_id: String(payment.id),
        mp_status: payment.status,
        estado,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pedidoId);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error procesando webhook de Mercado Pago:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Método no permitido' }, { status: 405 });
}
