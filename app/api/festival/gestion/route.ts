import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase';
import { tiposGestion, ventaEnGestion } from '@/lib/gestion-entradas';

/**
 * Para el panel: si la venta está conectada a Manso Gestión y, si lo está, los
 * tipos con lo que queda de cada uno. Las variables de Gestión solo existen en
 * el servidor, así que el panel no tiene otra forma de saberlo.
 */
export async function GET() {
  const auth = await createSupabaseServer();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { data: role } = await auth.rpc('get_user_role', { user_id: user.id });
  if (role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  if (!ventaEnGestion()) return NextResponse.json({ conectado: false });
  try {
    return NextResponse.json({ conectado: true, tipos: await tiposGestion() });
  } catch (e) {
    console.error('Panel: no se pudieron leer los tipos de Gestión:', e);
    return NextResponse.json({ conectado: true, error: 'Gestión no respondió.' });
  }
}
