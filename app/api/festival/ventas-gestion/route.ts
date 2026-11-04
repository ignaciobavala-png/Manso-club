import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase';
import { ventaEnGestion, ventasAdminGestion } from '@/lib/gestion-entradas';

/**
 * Todas las entradas del festival que hay en Manso Gestión, las vendidas por la
 * web y las cargadas a mano (una transferencia, efectivo), para que el panel de
 * Ventas muestre una sola lista. Solo lectura y solo admin: el navegador nunca
 * habla con Gestión, la RPC corre con la service role en el servidor.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await createSupabaseServer();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { data: role } = await auth.rpc('get_user_role', { user_id: user.id });
  if (role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  if (!ventaEnGestion()) return NextResponse.json({ error: 'La venta no está conectada a Gestión' }, { status: 409 });

  try {
    return NextResponse.json({ ventas: await ventasAdminGestion() });
  } catch (e) {
    console.error('No se pudieron leer las ventas de Gestión:', e);
    return NextResponse.json({ error: 'No se pudieron leer las ventas de Gestión' }, { status: 500 });
  }
}
