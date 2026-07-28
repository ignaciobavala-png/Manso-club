import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getMPPreferenceClient, getSiteUrl } from '@/lib/mercadopago';
import { getCotizacionDolar, usdToArs } from '@/lib/dolar';

interface CreatePreferenceRequest {
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
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Mercado Pago no está configurado' },
        { status: 500 }
      );
    }

    const body: CreatePreferenceRequest = await request.json();
    const { cliente, items } = body;

    if (!cliente?.nombre || !cliente?.mail || !cliente?.telefono || !items?.length) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Validar productos y precios reales desde la base (nunca confiar en el precio del cliente)
    const ids = items.map((i) => i.id);
    const { data: productos, error: productosError } = await supabase
      .from('productos')
      .select('id, nombre, precio, stock')
      .in('id', ids);

    if (productosError || !productos || productos.length !== ids.length) {
      return NextResponse.json({ error: 'Uno o más productos no existen' }, { status: 400 });
    }

    // Los precios de `productos` están en USD y Mercado Pago cobra en ARS.
    // La cotización se resuelve acá y nunca se acepta desde el cliente: si
    // viniera del navegador se podría manipular para pagar menos.
    let cotizacion;
    try {
      cotizacion = await getCotizacionDolar();
    } catch {
      return NextResponse.json(
        {
          error:
            'No pudimos obtener la cotización del dólar en este momento. Probá de nuevo en unos minutos o coordiná el pago por WhatsApp.',
        },
        { status: 503 }
      );
    }

    const pedidoProductos = items.map((item) => {
      const producto = productos.find((p) => p.id === item.id)!;
      if (typeof producto.stock === 'number' && item.quantity > producto.stock) {
        throw new Error(`Sin stock suficiente para ${producto.nombre}`);
      }
      const precioUsd = Number(producto.precio);
      return {
        id: producto.id,
        nombre: producto.nombre,
        precio_usd: precioUsd,
        precio: usdToArs(precioUsd, cotizacion.venta),
        quantity: item.quantity,
      };
    });

    const total = pedidoProductos.reduce((acc, p) => acc + p.precio * p.quantity, 0);
    const totalUsd = pedidoProductos.reduce((acc, p) => acc + p.precio_usd * p.quantity, 0);

    const { data: pedido, error: pedidoError } = await supabase
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
        cotizacion_dolar: cotizacion.venta,
        moneda_origen: 'USD',
        estado: 'pendiente_pago',
        metodo_pago: 'mercadopago',
      })
      .select()
      .single();

    if (pedidoError || !pedido) {
      console.error('Error creando pedido:', pedidoError);
      return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 });
    }

    const siteUrl = getSiteUrl();
    const preferenceClient = getMPPreferenceClient();

    const preference = await preferenceClient.create({
      body: {
        items: pedidoProductos.map((p) => ({
          id: p.id,
          title: p.nombre,
          quantity: p.quantity,
          unit_price: p.precio,
          currency_id: 'ARS',
        })),
        payer: {
          name: cliente.nombre,
          email: cliente.mail,
          phone: { number: cliente.telefono },
        },
        external_reference: pedido.id,
        back_urls: {
          success: `${siteUrl}/checkout/success`,
          failure: `${siteUrl}/checkout/failure`,
          pending: `${siteUrl}/checkout/pending`,
        },
        auto_return: 'approved',
        notification_url: `${siteUrl}/api/mp/webhook`,
      },
    });

    await supabase
      .from('pedidos')
      .update({ mp_preference_id: preference.id })
      .eq('id', pedido.id);

    return NextResponse.json({
      success: true,
      pedido_id: pedido.id,
      init_point: preference.init_point,
      total_ars: total,
      cotizacion: cotizacion.venta,
    });
  } catch (error) {
    console.error('Error creando preferencia de Mercado Pago:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
