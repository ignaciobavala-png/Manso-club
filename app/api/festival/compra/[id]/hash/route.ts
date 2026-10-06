import { NextRequest, NextResponse } from 'next/server';
import { adminFestival, leerOrden, reclamarConHash } from '@/lib/festival-compra';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** "Ya pagué y no se acredita": el comprador pega el hash de su transferencia. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'No existe' }, { status: 404 });

  const { hash } = await request.json().catch(() => ({}));
  if (typeof hash !== 'string' || !hash.trim()) {
    return NextResponse.json({ ok: false, mensaje: 'Pegá el hash de la transacción.' }, { status: 400 });
  }

  const supabase = adminFestival();
  const orden = await leerOrden(supabase, id);
  if (!orden) return NextResponse.json({ error: 'No existe' }, { status: 404 });

  try {
    return NextResponse.json(await reclamarConHash(supabase, orden, hash));
  } catch (e) {
    console.error(`No se pudo verificar el hash de la orden ${id}:`, e);
    return NextResponse.json(
      { ok: false, mensaje: 'No pudimos consultar la red en este momento. Probá en un minuto.' },
      { status: 502 }
    );
  }
}
