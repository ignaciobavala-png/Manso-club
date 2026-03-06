import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - Obtener configuración del checkout
export async function GET() {
  try {
    console.log('🔍 Obteniendo configuración de checkout...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('🔑 Variables de entorno:', {
      supabaseUrl: supabaseUrl ? '✅ Configurada' : '❌ No configurada',
      supabaseAnonKey: supabaseAnonKey ? '✅ Configurada' : '❌ No configurada'
    });

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Variables de entorno de Supabase no configuradas');
      return NextResponse.json(
        { error: 'Configuración de base de datos incompleta' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    
    console.log('📊 Consultando tabla checkout_config...');
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
      console.error('❌ Error de Supabase:', error);
      console.error('Detalles:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Si la tabla no existe, devolver configuración por defecto
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.log('⚠️ Tabla checkout_config no existe, usando valores por defecto');
        const defaultConfig = {
          banco_nombre: 'Banco Galicia',
          banco_cbu: '0070053430000001234567',
          banco_alias: 'MANSO.CLUB.TIENDA',
          banco_titular: 'MANSO CLUB S.A.',
          banco_cuit: '30-12345678-9',
          whatsapp_numero: '5491130232533',
          whatsapp_mensaje_confirmacion: '',
          email_notificaciones: 'ana@manso.club',
          moneda: 'ARS',
          tiempo_entrega: '3-5 días hábiles'
        };
        
        return NextResponse.json({
          success: true,
          config: defaultConfig,
          warning: 'Usando configuración por defecto. Configura desde el dashboard admin.'
        });
      }
      
      return NextResponse.json(
        { error: 'Error al obtener configuración: ' + error.message },
        { status: 500 }
      );
    }

    console.log('✅ Configuración obtenida:', data?.length || 0, 'items');

    // Convertir array a objeto
    const config: Record<string, string> = {};
    data?.forEach((item: { key: string; value: string }) => {
      config[item.key] = item.value;
    });

    // Si no hay datos, usar valores por defecto
    if (Object.keys(config).length === 0) {
      console.log('⚠️ No hay configuración guardada, usando valores por defecto');
      const defaultConfig = {
        banco_nombre: 'Banco Galicia',
        banco_cbu: '0070053430000001234567',
        banco_alias: 'MANSO.CLUB.TIENDA',
        banco_titular: 'MANSO CLUB S.A.',
        banco_cuit: '30-12345678-9',
        whatsapp_numero: '5491130232533',
        whatsapp_mensaje_confirmacion: '',
        email_notificaciones: 'ana@manso.club',
        moneda: 'ARS',
        tiempo_entrega: '3-5 días hábiles'
      };
      
      return NextResponse.json({
        success: true,
        config: defaultConfig,
        warning: 'Usando configuración por defecto. Configura desde el dashboard admin.'
      });
    }

    return NextResponse.json({
      success: true,
      config
    });

  } catch (error) {
    console.error('❌ Error general en GET checkout config:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Guardar configuración del checkout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Variables de entorno de Supabase no configuradas');
      return NextResponse.json(
        { error: 'Configuración de base de datos incompleta' },
        { status: 500 }
      );
    }
    
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

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    
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
