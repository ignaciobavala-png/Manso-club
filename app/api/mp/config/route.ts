import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAnon } from '../../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Leer configuración pública desde Supabase
    const supabase = createSupabaseAnon();
    const { data: configs, error: configError } = await supabase
      .from('configuracion')
      .select('clave, valor')
      .in('clave', ['mp_public_key', 'mp_modo_sandbox']);

    if (configError) {
      console.error('Error leyendo configuración:', configError);
      return NextResponse.json(
        { error: 'Error obteniendo configuración' },
        { status: 500 }
      );
    }

    const publicKey = configs?.find(c => c.clave === 'mp_public_key')?.valor || '';
    const modoSandbox = configs?.find(c => c.clave === 'mp_modo_sandbox')?.valor === 'true';

    if (!publicKey) {
      return NextResponse.json(
        { error: 'Public Key no configurada' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      public_key: publicKey,
      modo: modoSandbox ? 'sandbox' : 'production',
    });

  } catch (error) {
    console.error('Error en /api/mp/config:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
