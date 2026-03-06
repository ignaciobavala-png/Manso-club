import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface NotifyRequest {
  mensaje: string;
  cliente: {
    nombre: string;
    mail: string;
    telefono: string;
  };
  productos: Array<{
    id: string;
    nombre: string;
    precio: number;
    quantity: number;
  }>;
  total: number;
  config: any;
}

export async function POST(request: NextRequest) {
  try {
    const body: NotifyRequest = await request.json();
    
    // Validar datos
    if (!body.mensaje || !body.cliente || !body.productos) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    // Crear cliente Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Guardar pedido en base de datos
    const pedidoData = {
      cliente_nombre: body.cliente.nombre,
      cliente_email: body.cliente.mail,
      cliente_telefono: body.cliente.telefono,
      productos: body.productos,
      total: body.total,
      estado: 'pendiente_pago',
      mensaje_whatsapp: body.mensaje,
      created_at: new Date().toISOString()
    };

    const { data: pedido, error: dbError } = await supabase
      .from('pedidos')
      .insert(pedidoData)
      .select()
      .single();

    if (dbError) {
      console.error('Error guardando pedido:', dbError);
    }

    // 2. Log del pedido
    console.log('🛒 Nuevo pedido recibido:', {
      cliente: body.cliente.nombre,
      email: body.cliente.mail,
      telefono: body.cliente.telefono,
      total: body.total,
      cantidadProductos: body.productos.length,
      pedido_id: pedido?.id,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      pedido_id: pedido?.id,
      message: 'Pedido recibido exitosamente',
      db_guardado: !!pedido
    });

  } catch (error) {
    console.error('Error en endpoint de notificación:', error);
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Método no permitido' },
    { status: 405 }
  );
}
