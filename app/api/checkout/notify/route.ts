import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCotizacionDolar } from '@/lib/dolar';
import { formatArs, monedaDe, precioEnArs, precioEnUsd } from '@/lib/precios';

interface NotifyRequest {
  cliente: {
    nombre: string;
    mail: string;
    telefono: string;
    dni: string;
    direccion: string;
  };
  items: Array<{ id: string; quantity: number }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: NotifyRequest = await request.json();
    const { cliente, items } = body;

    if (!cliente?.nombre || !cliente?.mail || !cliente?.telefono || !items?.length) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Precios y totales se recalculan acá: lo que manda el navegador no es confiable.
    const ids = items.map((i) => i.id);
    const { data: productos, error: productosError } = await supabase
      .from('productos')
      .select('id, nombre, precio, stock, moneda')
      .eq('active', true)
      .in('id', ids);

    if (productosError || !productos || productos.length !== ids.length) {
      return NextResponse.json({ error: 'Uno o más productos ya no están disponibles' }, { status: 400 });
    }

    // La cotización sólo hace falta si hay algún producto cargado en dólares.
    const hayDolares = productos.some((p) => monedaDe(p) === 'USD');
    let cotizacion: number | null = null;
    try {
      cotizacion = (await getCotizacionDolar()).venta;
    } catch {
      if (hayDolares) {
        return NextResponse.json(
          { error: 'No pudimos obtener la cotización del dólar. Probá de nuevo en unos minutos.' },
          { status: 503 }
        );
      }
    }

    const pedidoProductos = items.map((item) => {
      const producto = productos.find((p) => p.id === item.id)!;
      return {
        id: producto.id,
        nombre: producto.nombre,
        moneda: monedaDe(producto),
        precio_usd: precioEnUsd(producto, cotizacion),
        precio: precioEnArs(producto, cotizacion)!,
        quantity: item.quantity,
      };
    });

    const total = pedidoProductos.reduce((acc, p) => acc + p.precio * p.quantity, 0);
    // Sin cotización (pedido todo en pesos) no hay equivalente en dólares.
    const totalUsd = pedidoProductos.every((p) => p.precio_usd !== null)
      ? pedidoProductos.reduce((acc, p) => acc + p.precio_usd! * p.quantity, 0)
      : null;

    const productosTexto = pedidoProductos
      .map((p) => `• ${p.nombre} x${p.quantity} — ${formatArs(p.precio * p.quantity)}`)
      .join('\n');

    const mensaje =
      `*🛒 NUEVO PEDIDO MANSO CLUB*\n\n` +
      `*DATOS DEL CLIENTE:*\n` +
      `👤 Nombre: ${cliente.nombre}\n` +
      `📧 Email: ${cliente.mail}\n` +
      `📱 Teléfono: ${cliente.telefono}\n` +
      `🆔 DNI: ${cliente.dni}\n` +
      `🏠 Dirección: ${cliente.direccion}\n\n` +
      `*PRODUCTOS SOLICITADOS:*\n${productosTexto}\n\n` +
      `*TOTAL: ${formatArs(total)}*\n` +
      (totalUsd !== null && cotizacion
        ? `_(USD ${Math.round(totalUsd)} — cotización $${cotizacion})_\n\n`
        : `\n`) +
      `*📋 PRÓXIMOS PASOS:*\n` +
      `1. Contactar al cliente para confirmar el pedido\n` +
      `2. Enviar datos bancarios para el pago\n` +
      `3. Cotizar y coordinar el envío`;

    const { data: pedido, error: dbError } = await supabase
      .from('pedidos')
      .insert({
        cliente_nombre: cliente.nombre,
        cliente_email: cliente.mail,
        cliente_telefono: cliente.telefono,
        cliente_dni: cliente.dni,
        cliente_direccion: cliente.direccion,
        productos: pedidoProductos,
        total,
        total_usd: totalUsd,
        cotizacion_dolar: cotizacion,
        moneda_origen: hayDolares ? 'USD' : 'ARS',
        estado: 'pendiente_pago',
        metodo_pago: 'transferencia',
        mensaje_whatsapp: mensaje,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error guardando pedido:', dbError);
      return NextResponse.json({ error: 'No se pudo registrar el pedido' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      pedido_id: pedido?.id,
      total_ars: total,
      cotizacion,
      message: 'Pedido recibido exitosamente',
    });
  } catch (error) {
    console.error('Error en endpoint de notificación:', error);

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Método no permitido' }, { status: 405 });
}
