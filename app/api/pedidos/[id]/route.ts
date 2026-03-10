import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pedidoId } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verificar que el pedido exista antes de eliminar
    const { data: pedido, error: fetchError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .single();

    if (fetchError) {
      console.error('Error verificando pedido:', fetchError);
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el pedido
    const { error: deleteError } = await supabase
      .from('pedidos')
      .delete()
      .eq('id', pedidoId);

    if (deleteError) {
      console.error('Error eliminando pedido:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar pedido' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pedido eliminado correctamente',
      pedidoEliminado: pedido
    });

  } catch (error) {
    console.error('Error en API de eliminación de pedido:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
