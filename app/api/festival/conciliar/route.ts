import { NextResponse } from 'next/server';
import { ORDEN_REDES } from '@/lib/cripto-redes';
import { adminFestival, enviarMailTickets, sincronizarRed, vencerOrdenes } from '@/lib/festival-compra';

export const maxDuration = 60;

/**
 * Cron del cobro en cripto. La pantalla de pago ya lee la cadena mientras el
 * comprador la tiene abierta; esto cubre al que la cerró apenas mandó la
 * transferencia: lee cada red con órdenes abiertas, vence las que pasaron su
 * plazo y reintenta los mails que fallaron.
 */
export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = adminFestival();
  const redes: Record<string, string> = {};
  for (const red of ORDEN_REDES) {
    try {
      await sincronizarRed(supabase, red, { forzar: true });
      redes[red] = 'ok';
    } catch (e) {
      redes[red] = e instanceof Error ? e.message : String(e);
      console.error(`Conciliación de ${red}:`, e);
    }
  }

  await vencerOrdenes(supabase);

  const { data: sinMail } = await supabase
    .from('festival_ordenes')
    .select('id, nombre, email, cantidad_entradas')
    .eq('estado', 'pagada')
    .eq('mail_enviado', false)
    .limit(20);
  for (const orden of sinMail ?? []) await enviarMailTickets(supabase, orden);

  return NextResponse.json({ ok: true, redes, mails: sinMail?.length ?? 0 });
}
