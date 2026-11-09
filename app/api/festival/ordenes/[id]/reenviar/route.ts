import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase';
import { adminFestival, enviarMailTickets, leerOrden } from '@/lib/festival-compra';

/**
 * Ana reenvía el mail con los QR de una orden ya pagada (alguien dice que no le
 * llegó, o se equivocó de casilla). Solo admin. Suelta la marca `mail_enviado` y
 * reusa el envío normal, que la vuelve a reclamar, así que dos clics seguidos no
 * duplican el mail.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await createSupabaseServer();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { data: role } = await auth.rpc('get_user_role', { user_id: user.id });
  if (role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;
  const supabase = adminFestival();
  const orden = await leerOrden(supabase, id);
  if (!orden) return NextResponse.json({ error: 'No existe esa orden' }, { status: 404 });
  if (orden.estado !== 'pagada') return NextResponse.json({ error: 'La orden todavía no está pagada' }, { status: 409 });

  await supabase.from('festival_ordenes').update({ mail_enviado: false }).eq('id', id);
  await enviarMailTickets(supabase, orden);

  const { data: despues } = await supabase.from('festival_ordenes').select('mail_enviado').eq('id', id).maybeSingle();
  if (!despues?.mail_enviado) return NextResponse.json({ error: 'No se pudo enviar el mail. Probá de nuevo en un momento.' }, { status: 502 });
  return NextResponse.json({ ok: true });
}
