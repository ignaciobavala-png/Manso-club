import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAnon } from '../../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Leer access token desde configuración
    const supabase = createSupabaseAnon();
    const { data: configData, error: configError } = await supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', 'mp_access_token')
      .single();

    if (configError || !configData?.valor) {
      return NextResponse.json(
        { ok: false, error: 'Access Token no configurado' },
        { status: 400 }
      );
    }

    const accessToken = configData.valor;

    // Probar conexión con Mercado Pago API
    const response = await fetch('https://api.mercadopago.com/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          ok: false, 
          error: errorData.message || `Error ${response.status}: ${response.statusText}` 
        },
        { status: 400 }
      );
    }

    const userData = await response.json();

    return NextResponse.json({
      ok: true,
      nombre: userData.nickname || userData.first_name || 'Usuario MP',
      email: userData.email,
      id: userData.id,
    });

  } catch (error) {
    console.error('Error en test de Mercado Pago:', error);
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
