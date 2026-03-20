import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServer } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await createSupabaseServer();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { data: role } = await auth.rpc('get_user_role', { user_id: user.id });
  if (role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

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
