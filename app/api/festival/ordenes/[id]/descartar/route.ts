import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase';
import { adminFestival, descartarOrden, leerOrden } from '@/lib/festival-compra';

/**
 * Ana descarta una compra que no se va a pagar (la transferencia nunca llegó):
 * la orden queda vencida y, si reservó en Manso Gestión, libera el cupo. Una
 * transferencia reserva sin vencimiento, así que sin esto el lugar quedaría
 * tomado hasta el día del evento.
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
  if (orden.estado === 'pagada') return NextResponse.json({ error: 'La orden ya está pagada' }, { status: 409 });

  try {
    await descartarOrden(supabase, orden);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(`No se pudo descartar la orden ${id}:`, e);
    return NextResponse.json({ error: 'No se pudo descartar la orden' }, { status: 500 });
  }
}
