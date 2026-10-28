import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase';
import { adminFestival, borrarOrden, leerOrden } from '@/lib/festival-compra';

/**
 * Ana borra una compra que no es una venta (una prueba, un carrito que nadie
 * pagó). Libera el cupo en Manso Gestión y elimina la orden. Las pagadas no se
 * pueden borrar.
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
    await borrarOrden(supabase, orden);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(`No se pudo borrar la orden ${id}:`, e);
    return NextResponse.json({ error: 'No se pudo borrar la orden' }, { status: 500 });
  }
}
