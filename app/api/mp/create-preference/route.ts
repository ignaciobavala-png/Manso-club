import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAnon } from '../../../../lib/supabase';
import { nanoid } from 'nanoid';

interface CreatePreferenceRequest {
  items: Array<{
    id: string;
    nombre: string;
    precio: number;
    cantidad: number;
    tipo: 'producto' | 'membresia' | 'entrada';
    referencia_id?: string;
  }>;
  email: string;
  nombre: string;
  telefono: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePreferenceRequest = await request.json();
    const { items, email, nombre, telefono } = body;

    if (!items || items.length === 0 || !email || !nombre) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: items, email, nombre' },
        { status: 400 }
      );
    }

    // Leer credenciales desde configuración
    const supabase = createSupabaseAnon();
    const { data: configs, error: configError } = await supabase
      .from('configuracion')
      .select('clave, valor')
      .in('clave', ['mp_access_token', 'mp_modo_sandbox']);

    if (configError || !configs || configs.length < 2) {
      return NextResponse.json(
        { error: 'Configuración de Mercado Pago incompleta' },
        { status: 400 }
      );
    }

    const accessToken = configs.find(c => c.clave === 'mp_access_token')?.valor;
    const modoSandbox = configs.find(c => c.clave === 'mp_modo_sandbox')?.valor === 'true';

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access Token no configurado' },
        { status: 400 }
      );
    }

    // Calcular total
    const total = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    // Crear orden en base de datos
    const { data: orden, error: ordenError } = await supabase
      .from('ordenes')
      .insert({
        email,
        nombre,
        telefono,
        estado: 'pendiente',
        total,
        tipo: items.length === 1 ? items[0].tipo : 'mixto',
      })
      .select()
      .single();

    if (ordenError || !orden) {
      console.error('Error creando orden:', ordenError);
      return NextResponse.json(
        { error: 'Error al crear orden' },
        { status: 500 }
      );
    }

    // Crear orden_items
    const ordenItems = items.map(item => ({
      orden_id: orden.id,
      tipo: item.tipo,
      referencia_id: item.referencia_id || item.id,
      nombre: item.nombre,
      precio: item.precio,
      cantidad: item.cantidad,
    }));

    const { error: itemsError } = await supabase
      .from('orden_items')
      .insert(ordenItems);

    if (itemsError) {
      console.error('Error creando orden_items:', itemsError);
      return NextResponse.json(
        { error: 'Error al guardar items de la orden' },
        { status: 500 }
      );
    }

    // Preparar items para Mercado Pago
    const mpItems = items.map(item => ({
      id: item.id,
      title: item.nombre,
      quantity: item.cantidad,
      unit_price: item.precio,
      currency_id: 'ARS',
    }));

    // Obtener dominio base para URLs
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://manso.club');

    // Crear preferencia en Mercado Pago
    const preferenceData = {
      items: mpItems,
      payer: {
        email,
        name: nombre,
      },
      back_urls: {
        success: `${baseUrl}/checkout/success`,
        failure: `${baseUrl}/checkout/failure`,
        pending: `${baseUrl}/checkout/pending`,
      },
      auto_return: 'approved',
      notification_url: `${baseUrl}/api/mp/webhook`,
      external_reference: orden.id.toString(),
      statement_descriptor: 'MANSO CLUB',
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceData),
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.json().catch(() => ({}));
      console.error('Error Mercado Pago:', errorData);
      
      // Actualizar orden con error
      await supabase
        .from('ordenes')
        .update({ estado: 'error' })
        .eq('id', orden.id);

      return NextResponse.json(
        { 
          error: 'Error al crear preferencia de pago',
          details: errorData.message || `Error ${mpResponse.status}`
        },
        { status: 500 }
      );
    }

    const preference = await mpResponse.json();

    // Actualizar orden con el preference_id de MP
    await supabase
      .from('ordenes')
      .update({ mp_preference_id: preference.id })
      .eq('id', orden.id);

    return NextResponse.json({
      preference_id: preference.id,
      init_point: modoSandbox ? preference.sandbox_init_point : preference.init_point,
      orden_id: orden.id,
    });

  } catch (error) {
    console.error('Error en create-preference:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
