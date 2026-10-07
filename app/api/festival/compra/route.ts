import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase';
import { getCotizacionDolar } from '@/lib/dolar';
import { leerConfig } from '@/lib/festival';
import { adminFestival, crearPreferenciaMP, leerOrden, mediosDePago, type ItemOrden } from '@/lib/festival-compra';
import type { FestivalEntrada, MedioPago } from '@/lib/types/festival';

interface CompraRequest {
  nombre: string;
  email: string;
  metodo: MedioPago;
  items: Array<{ id: string; cantidad: number }>;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Arma la orden y devuelve a dónde mandar al comprador: el checkout de Mercado
 * Pago, o su compra (`/festival/compra/[id]`) para transferencia y cripto.
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

  // Con el cliente con cookies: el RLS esconde las entradas mientras el
  // festival no esté publicado, salvo para un admin (que así puede probar).
  const supabase = await createSupabaseServer();
  const { data: entradas } = await supabase
    .from('festival_entradas')
    .select('*')
    .eq('activo', true)
    .eq('estado', 'en_venta')
    .in(
      'id',
      pedidos.map(p => p.id)
    );

  const items: ItemOrden[] = [];
  for (const pedido of pedidos) {
    const entrada = (entradas as FestivalEntrada[] | null)?.find(e => e.id === pedido.id);
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
    })
    .select('id')
    .single();

  if (error || !orden) {
    console.error('No se pudo crear la orden del festival:', error);
    return NextResponse.json({ error: 'No pudimos registrar la compra.' }, { status: 500 });
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

  return NextResponse.json({ url: `/festival/compra/${orden.id}` });
}
