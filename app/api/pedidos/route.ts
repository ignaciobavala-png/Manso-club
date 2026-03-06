import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log('🔍 Iniciando fetch de pedidos...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('🔑 Variables de entorno:', {
      supabaseUrl: supabaseUrl ? '✅ Configurada' : '❌ No configurada',
      supabaseKey: supabaseKey ? '✅ Configurada' : '❌ No configurada'
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Variables de entorno de Supabase no configuradas');
      return NextResponse.json(
        { error: 'Configuración de base de datos incompleta' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('📊 Consultando tabla pedidos...');
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error de Supabase:', error);
      console.error('Detalles:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Si la tabla no existe, dar instrucciones específicas
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return NextResponse.json({
          error: 'La tabla pedidos no existe. Ejecuta la migration SQL en Supabase.',
          details: 'Ejecuta el contenido de supabase/migration_pedidos.sql en tu proyecto Supabase'
        }, { status: 500 });
      }
      
      return NextResponse.json(
        { error: 'Error al obtener pedidos: ' + error.message },
        { status: 500 }
      );
    }

    console.log('✅ Pedidos obtenidos:', pedidos?.length || 0);
    return NextResponse.json({
      success: true,
      pedidos: pedidos || []
    });

  } catch (error) {
    console.error('❌ Error general en API de pedidos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
