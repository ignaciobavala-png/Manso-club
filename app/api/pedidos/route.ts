import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServer } from '@/lib/supabase';

async function requireAdmin() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: role } = await supabase.rpc('get_user_role', { user_id: user.id });
  return role === 'admin' ? user : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Configuración de base de datos incompleta' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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
