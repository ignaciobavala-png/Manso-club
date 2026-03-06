import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAnon } from '@/lib/supabase';

// GET - Obtener configuración del checkout
export async function GET() {
  try {
    const supabase = createSupabaseAnon();
    
    const { data, error } = await supabase
      .from('checkout_config')
      .select('key, value')
      .in('key', [
        'banco_nombre',
        'banco_cbu', 
        'banco_alias',
        'banco_titular',
        'banco_cuit',
        'whatsapp_numero',
        'whatsapp_mensaje_confirmacion',
        'email_notificaciones',
        'moneda',
        'tiempo_entrega'
      ]);

    if (error) {
      console.error('Error fetching checkout config:', error);
      return NextResponse.json(
        { error: 'Error al obtener configuración' },
        { status: 500 }
      );
    }

    // Convertir array a objeto
    const config: Record<string, string> = {};
    data?.forEach((item: { key: string; value: string }) => {
      config[item.key] = item.value;
    });

    return NextResponse.json({
      success: true,
      config
    });

  } catch (error) {
    console.error('Error in GET checkout config:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Guardar configuración del checkout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos requeridos
    const requiredFields = [
      'banco_nombre',
      'banco_cbu',
      'banco_alias', 
      'banco_titular',
      'whatsapp_numero'
    ];

    for (const field of requiredFields) {
      if (!body[field] || body[field].trim() === '') {
        return NextResponse.json(
          { error: `El campo ${field} es requerido` },
          { status: 400 }
        );
      }
    }

    const supabase = createSupabaseAnon();
    
    // Preparar datos para upsert
    const configData = Object.entries(body).map(([key, value]) => ({
      key,
      value: String(value),
      description: getConfigDescription(key)
    }));

    // Usar upsert para actualizar o insertar
    const { data, error } = await supabase
      .from('checkout_config')
      .upsert(configData, { onConflict: 'key' })
      .select();

    if (error) {
      console.error('Error saving checkout config:', error);
      return NextResponse.json(
        { error: 'Error al guardar configuración' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada correctamente',
      updated: data?.length || 0
    });

  } catch (error) {
    console.error('Error in POST checkout config:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función auxiliar para obtener descripción de cada configuración
function getConfigDescription(key: string): string {
  const descriptions: Record<string, string> = {
    'banco_nombre': 'Nombre del banco para transferencias',
    'banco_cbu': 'CBU para transferencias bancarias',
    'banco_alias': 'Alias para transferencias bancarias',
    'banco_titular': 'Titular de la cuenta bancaria',
    'banco_cuit': 'CUIT del titular',
    'whatsapp_numero': 'Número de WhatsApp para notificaciones',
    'whatsapp_mensaje_confirmacion': 'Mensaje de confirmación automático',
    'email_notificaciones': 'Email para recibir notificaciones de pedidos',
    'moneda': 'Moneda predeterminada para los pedidos',
    'tiempo_entrega': 'Tiempo estimado de entrega'
  };
  
  return descriptions[key] || 'Configuración del checkout';
}
