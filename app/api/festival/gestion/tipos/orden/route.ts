import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase';
import { ErrorGestion, ordenarTiposGestion, ventaEnGestion } from '@/lib/gestion-entradas';

/**
 * Ana ordena los tipos de entrada desde el panel. La orden vive en Gestión
 * (`web_ordenar_tipos`): es la misma que ve la tabla de venta de la web.
 */
async function esAdmin() {
  const auth = await createSupabaseServer();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return false;
  const { data: role } = await auth.rpc('get_user_role', { user_id: user.id });
  return role === 'admin';
}

export async function POST(request: Request) {
  if (!(await esAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!ventaEnGestion()) return NextResponse.json({ error: 'La venta no está conectada a Gestión' }, { status: 409 });

  const b = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = b?.ids;
  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    !ids.every(id => typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id))
  ) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  try {
    await ordenarTiposGestion(ids as string[]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('No se pudo ordenar los tipos de Gestión:', e);
    const mensaje = e instanceof ErrorGestion ? 'Gestión no pudo ordenar los tipos' : 'No se pudo ordenar los tipos';
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
