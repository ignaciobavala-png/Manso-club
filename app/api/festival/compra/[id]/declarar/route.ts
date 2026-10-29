import { NextRequest, NextResponse } from 'next/server';
import { adminFestival, declararTransferencia, leerOrden } from '@/lib/festival-compra';

/**
 * "Ya transferí": el comprador avisa que pagó. Declaración, no pago: la orden
 * pasa a "Por confirmar" de Ana y le llega el mail, pero las entradas no se
 * emiten hasta que ella confirme contra el banco. Exige el comprobante subido.
 * El id (UUID) es la llave, como en el resto de `/api/festival/compra/[id]`.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'No existe' }, { status: 404 });

  const supabase = adminFestival();
  const orden = await leerOrden(supabase, id);
  if (!orden) return NextResponse.json({ error: 'No existe' }, { status: 404 });

  try {
    await declararTransferencia(supabase, orden);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : 'No se pudo registrar el aviso';
    console.error(`Aviso de transferencia de la orden ${id}:`, e);
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
