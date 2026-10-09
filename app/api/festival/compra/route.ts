import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase';
import { getCotizacionDolar } from '@/lib/dolar';
import { leerConfig, leerEntradas } from '@/lib/festival';
import { adminFestival, crearPreferenciaMP, leerOrden, mediosDePago, type ItemOrden } from '@/lib/festival-compra';
import { ErrorGestion, eventoGestion, reservarEnGestion, ventaEnGestion } from '@/lib/gestion-entradas';
import type { FestivalEntrada, MedioPago } from '@/lib/types/festival';

interface CompraRequest {
  nombre: string;
  email: string;
  metodo: MedioPago;
  items: Array<{ id: string; cantidad: number }>;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Cuánto ocupa cupo en Gestión una compra con Mercado Pago o cripto que no se
 * pagó. Si el pago llega después igual se acepta (`web_confirmar` confirma
 * tarde y avisa si eso pasó el aforo). La transferencia no vence: queda
 * reservada hasta que Ana la confirme o la descarte en Ventas.
 */
const MINUTOS_DE_RESERVA = 60;

/** Lo que le decimos al comprador según el código de `web_reservar`. */
function mensajeReserva(codigo: string): { error: string; status: number } {
  switch (codigo) {
    case 'tipo_agotado':
    case 'capacity_exceeded':
      return { error: 'No quedan entradas suficientes para esa compra. Actualizá la página y probá con menos.', status: 409 };
    case 'tipo_no_disponible':
    case 'ventas_pausadas':
    case 'evento_cerrado':
      return { error: 'Una de las entradas ya no está a la venta. Actualizá la página.', status: 409 };
    case 'max_por_compra':
      return { error: 'Superaste el máximo por compra de una de las entradas.', status: 400 };
    default:
      return { error: 'No pudimos reservar las entradas. Probá de nuevo.', status: 502 };
  }
}

/**
 * Arma la orden y devuelve a dónde mandar al comprador: el checkout de Mercado
 * Pago, o su compra (`/blur/compra/[id]`) para transferencia y cripto.
 * Precios, cantidades y cotización se resuelven acá: del navegador solo se
 * toma qué entradas, cuántas y con qué medio.
 */
export async function POST(request: NextRequest) {
  let body: CompraRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 });
  }

  const nombre = body.nombre?.trim();
  const email = body.email?.trim().toLowerCase();
  if (!nombre || nombre.length > 120 || !email || !EMAIL.test(email)) {
    return NextResponse.json({ error: 'Revisá el nombre y el mail.' }, { status: 400 });
  }

  const config = await leerConfig();
  const medios = config ? await mediosDePago(config) : [];
  if (!medios.includes(body.metodo)) {
    return NextResponse.json({ error: 'Ese medio de pago no está disponible.' }, { status: 400 });
  }
  const metodo = body.metodo;

  const pedidos = (body.items ?? []).filter(i => Number.isInteger(i.cantidad) && i.cantidad > 0);
  if (pedidos.length === 0) {
    return NextResponse.json({ error: 'Elegí al menos una entrada.' }, { status: 400 });
  }

  // Conectada a Gestión, los tipos vienen de allá. Si no, de `festival_entradas`
  // con el cliente con cookies: el RLS las esconde mientras el festival no esté
  // publicado, salvo para un admin (que así puede probar).
  const conGestion = ventaEnGestion();
  let entradas: FestivalEntrada[];
  if (conGestion) {
    entradas = (await leerEntradas()).filter(e => e.estado === 'en_venta');
  } else {
    const supabase = await createSupabaseServer();
    const { data } = await supabase
      .from('festival_entradas')
      .select('*')
      .eq('activo', true)
      .eq('estado', 'en_venta')
      .in(
        'id',
        pedidos.map(p => p.id)
      );
    entradas = (data as FestivalEntrada[] | null) ?? [];
  }

  const items: ItemOrden[] = [];
  for (const pedido of pedidos) {
    const entrada = entradas.find(e => e.id === pedido.id);
    if (!entrada || Number(entrada.precio) <= 0) {
      return NextResponse.json({ error: 'Una de las entradas ya no está a la venta.' }, { status: 409 });
    }
    if (pedido.cantidad > entrada.max_por_compra) {
      return NextResponse.json(
        { error: `${entrada.nombre}: máximo ${entrada.max_por_compra} por compra.` },
        { status: 400 }
      );
    }
    items.push({
      entrada_id: entrada.id,
      nombre: entrada.nombre,
      cantidad: pedido.cantidad,
      precio_ars: Number(entrada.precio),
      entradas_por_unidad: entrada.entradas_por_unidad,
    });
  }

  // El dólar solo es imprescindible en cripto; en pesos se guarda si está.
  let cotizacion: number | null = null;
  try {
    cotizacion = (await getCotizacionDolar()).venta;
  } catch {
    if (metodo === 'cripto') {
      return NextResponse.json(
        { error: 'No pudimos obtener la cotización del dólar. Probá de nuevo en unos minutos.' },
        { status: 503 }
      );
    }
  }

  const totalArs = items.reduce((acc, i) => acc + i.precio_ars * i.cantidad, 0);
  const totalUsd = cotizacion ? Math.round((totalArs / cotizacion) * 100) / 100 : null;
  if (metodo === 'cripto' && (totalUsd ?? 0) < 1) {
    return NextResponse.json({ error: 'El total es demasiado bajo para pagar en cripto.' }, { status: 400 });
  }
  const cantidadEntradas = items.reduce((acc, i) => acc + i.cantidad * i.entradas_por_unidad, 0);

  const admin = adminFestival();
  const { data: orden, error } = await admin
    .from('festival_ordenes')
    .insert({
      nombre,
      email,
      metodo,
      items,
      cantidad_entradas: cantidadEntradas,
      total_ars: totalArs,
      total_usd: totalUsd,
      cotizacion,
      gestion_event_id: conGestion ? eventoGestion() : null,
    })
    .select('id')
    .single();

  if (error || !orden) {
    console.error('No se pudo crear la orden del festival:', error);
    return NextResponse.json({ error: 'No pudimos registrar la compra.' }, { status: 500 });
  }

  // Todo o nada: si en Gestión no entra, la orden no existe.
  if (conGestion) {
    try {
      const tickets = await reservarEnGestion({
        ordenId: orden.id,
        nombre,
        email,
        items: items.map(i => ({ tipo_id: i.entrada_id, cantidad: i.cantidad })),
        venceAt: metodo === 'transferencia' ? null : new Date(Date.now() + MINUTOS_DE_RESERVA * 60_000),
      });
      await admin.from('festival_ordenes').update({ gestion_tickets: tickets }).eq('id', orden.id);
    } catch (e) {
      await admin.from('festival_ordenes').delete().eq('id', orden.id);
      const { error: mensaje, status } = mensajeReserva(e instanceof ErrorGestion ? e.codigo : '');
      if (status >= 500) console.error(`No se pudo reservar en Gestión la orden ${orden.id}:`, e);
      return NextResponse.json({ error: mensaje }, { status });
    }
  }

  if (metodo === 'mercadopago') {
    try {
      const ordenCompleta = await leerOrden(admin, orden.id);
      return NextResponse.json({ url: await crearPreferenciaMP(admin, ordenCompleta!) });
    } catch (e) {
      console.error(`No se pudo crear la preferencia de MP de la orden ${orden.id}:`, e);
      return NextResponse.json({ error: 'No pudimos conectar con Mercado Pago. Probá de nuevo.' }, { status: 502 });
    }
  }

  return NextResponse.json({ url: `/blur/compra/${orden.id}` });
}
