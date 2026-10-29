import { NextRequest, NextResponse } from 'next/server';
import { adminFestival, guardarComprobante, leerOrden, TOPE_COMPROBANTE_BYTES } from '@/lib/festival-compra';

/**
 * El comprador sube el comprobante de su transferencia. Como el resto de
 * `/api/festival/compra/[id]`, el id (UUID) es la llave. El archivo no va
 * directo a Storage con la anon key: pasa por acá para que el bucket quede
 * sin policies y solo se pueda subir a una orden de transferencia pendiente.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'No existe' }, { status: 404 });

  const form = await request.formData().catch(() => null);
  const archivo = form?.get('archivo');
  if (!(archivo instanceof File)) return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 });
  if (archivo.size > TOPE_COMPROBANTE_BYTES) {
    return NextResponse.json({ error: 'El comprobante pesa demasiado (máximo 4 MB)' }, { status: 413 });
  }

  const supabase = adminFestival();
  const orden = await leerOrden(supabase, id);
  if (!orden) return NextResponse.json({ error: 'No existe' }, { status: 404 });

  try {
    await guardarComprobante(supabase, orden, { bytes: Buffer.from(await archivo.arrayBuffer()), tipo: archivo.type });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : 'No se pudo guardar el comprobante';
    console.error(`Comprobante de la orden ${id}:`, e);
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
