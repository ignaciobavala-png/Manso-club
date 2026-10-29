import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase';
import { adminFestival, BUCKET_COMPROBANTES, leerOrden } from '@/lib/festival-compra';

/**
 * Ana abre el comprobante de una orden. Solo admin. Redirige a un link firmado
 * de 60 segundos (el bucket es privado), así el panel lo abre con un `<a
 * target="_blank">` común, sin esperar una respuesta antes de abrir la pestaña.
 */
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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
  if (!orden?.comprobante_path) return NextResponse.json({ error: 'Esta orden no tiene comprobante' }, { status: 404 });

  const { data, error } = await supabase.storage.from(BUCKET_COMPROBANTES).createSignedUrl(orden.comprobante_path, 60);
  if (error || !data) {
    console.error(`No se pudo firmar el comprobante de ${id}:`, error);
    return NextResponse.json({ error: 'No se pudo abrir el comprobante' }, { status: 500 });
  }
  return NextResponse.redirect(data.signedUrl);
}
