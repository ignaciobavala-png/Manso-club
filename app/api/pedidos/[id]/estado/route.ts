import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pedidoId } = await params;
    const { estado } = await request.json();

    if (!estado) {
      return NextResponse.json(
        { error: 'Estado es requerido' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: pedido, error } = await supabase
      .from('pedidos')
      .update({ 
        estado,
        updated_at: new Date().toISOString()
      })
      .eq('id', pedidoId)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando pedido:', error);
      return NextResponse.json(
        { error: 'Error al actualizar pedido' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pedido
    });

  } catch (error) {
    console.error('Error en API de actualización de pedido:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
