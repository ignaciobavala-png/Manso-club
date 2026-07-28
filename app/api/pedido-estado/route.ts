import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Estado de un pedido para las pantallas de retorno de Mercado Pago.
 * Devuelve solo lo mínimo para mostrar la confirmación: el id del pedido llega
 * por la URL, así que no se exponen datos del comprador.
 */
export async function GET(request: NextRequest) {
  const pedidoId = request.nextUrl.searchParams.get('id');

  if (!pedidoId) {
    return NextResponse.json({ error: 'Falta el identificador del pedido' }, { status: 400 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('pedidos')
      .select('id, estado, mp_status, total, metodo_pago')
      .eq('id', pedidoId)
      .maybeSingle();

    if (error) {
      console.error('Error consultando pedido:', error);
      return NextResponse.json({ error: 'Error al consultar el pedido' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      estado: data.estado,
      mp_status: data.mp_status,
      total: data.total,
      metodo_pago: data.metodo_pago,
    });
  } catch (error) {
    console.error('Error en pedido-estado:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
