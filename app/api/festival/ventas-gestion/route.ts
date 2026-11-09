import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase';
import { ventaEnGestion, ventasAdminGestion } from '@/lib/gestion-entradas';
import { adminFestival } from '@/lib/festival-compra';

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
    const ventas = await ventasAdminGestion();
    // Las ventas de la web mandan su mail desde acá, no desde Gestión: Gestión
    // nunca marca `qr_mail_enviado_at` en ellas. Se cruza con la orden.
    const ids = [...new Set(ventas.filter(v => v.origen === 'web' && v.order_ref).map(v => v.order_ref as string))];
    const enviados = new Set<string>();
    if (ids.length) {
      const { data } = await adminFestival().from('festival_ordenes').select('id, mail_enviado').in('id', ids);
      for (const o of data ?? []) if (o.mail_enviado) enviados.add(o.id);
    }
    return NextResponse.json({ ventas: ventas.map(v => ({ ...v, mail_web: !!v.order_ref && enviados.has(v.order_ref) })) });
  } catch (e) {
    console.error('No se pudieron leer las ventas de Gestión:', e);
    return NextResponse.json({ error: 'No se pudieron leer las ventas de Gestión' }, { status: 500 });
  }
}
