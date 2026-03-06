import { NextRequest, NextResponse } from 'next/server';

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

    // Número de WhatsApp de MANSO CLUB
    const whatsappNumber = '5491130232533';
    
    // Codificar mensaje para WhatsApp
    const encodedMessage = encodeURIComponent(body.mensaje);
    
    // Crear URL de WhatsApp
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    // Enviar notificación interna (puedes agregar aquí lógica adicional como:
    // - Guardar en base de datos
    // - Enviar email de confirmación
    // - Notificar al equipo por Slack, etc.)
    
    console.log('🛒 Nuevo pedido recibido:', {
      cliente: body.cliente.nombre,
      email: body.cliente.mail,
      telefono: body.cliente.telefono,
      total: body.total,
      cantidadProductos: body.productos.length,
      timestamp: new Date().toISOString()
    });

    // Opcional: Si tienes una API de WhatsApp Business, puedes enviar el mensaje directamente
    // Por ahora, devolvemos la URL para que se abra manualmente
    
    return NextResponse.json({
      success: true,
      whatsappUrl,
      message: 'Notificación enviada exitosamente',
      pedido: {
        cliente: body.cliente.nombre,
        total: body.total,
        productos: body.productos.length
      }
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
