import { NextRequest, NextResponse } from 'next/server';
import { esRed } from '@/lib/cripto-redes';
import { walletDe } from '@/lib/cripto-escaner';
import { adminFestival, elegirRed, estadoPublico, leerOrden, sincronizarRed } from '@/lib/festival-compra';

/**
 * La pantalla de pago de una orden. El id (UUID) es la llave, como el link de
 * una entrada: quien lo tiene ve el estado, nunca el mail ni los datos internos.
 *
 *   GET  → estado; si espera un pago, antes lee la cadena (con freno).
 *   POST { red } → elige o cambia la red y recibe el monto exacto.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'No existe' }, { status: 404 });

  const supabase = adminFestival();
  let orden = await leerOrden(supabase, id);
  if (!orden) return NextResponse.json({ error: 'No existe' }, { status: 404 });

  if (orden.estado !== 'pagada' && orden.red) {
    try {
      await sincronizarRed(supabase, orden.red);
      orden = (await leerOrden(supabase, id)) ?? orden;
    } catch (e) {
      // Un nodo lento no le rompe la pantalla al comprador: el cron reintenta.
      console.error(`No se pudo leer ${orden.red} para la orden ${id}:`, e);
    }
  }

  return NextResponse.json(estadoPublico(orden));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'No existe' }, { status: 404 });

  const { red } = await request.json().catch(() => ({}));
  if (!esRed(red) || !walletDe(red)) {
    return NextResponse.json({ error: 'Esa red no está disponible.' }, { status: 400 });
  }

  const supabase = adminFestival();
  const orden = await leerOrden(supabase, id);
  if (!orden) return NextResponse.json({ error: 'No existe' }, { status: 404 });
  if (orden.estado === 'pagada') return NextResponse.json(estadoPublico(orden));

  try {
    await elegirRed(supabase, orden, red);
  } catch (e) {
    console.error(`No se pudo fijar la red de la orden ${id}:`, e);
    return NextResponse.json({ error: 'No pudimos preparar el pago. Probá de nuevo.' }, { status: 502 });
  }

  const actualizada = await leerOrden(supabase, id);
  return NextResponse.json(estadoPublico(actualizada!));
}
