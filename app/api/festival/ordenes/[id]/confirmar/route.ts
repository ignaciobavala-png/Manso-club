import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase';
import { adminFestival, emitirOrden, leerOrden } from '@/lib/festival-compra';

/**
 * Ana confirma desde el panel que llegó una transferencia: se emiten los
 * tickets y sale el mail con el link. Sirve también para una orden de otro
 * medio que haya quedado trabada (un MP aprobado por menos, por ejemplo), y
 * para una vencida: no hay un plazo que impida aceptar un pago tardío.
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
  if (orden.estado === 'pagada') return NextResponse.json({ ok: true });

  try {
    await emitirOrden(supabase, orden);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(`No se pudo confirmar la orden ${id}:`, e);
    return NextResponse.json({ error: 'No se pudo confirmar la orden' }, { status: 500 });
  }
}
