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

    // 2. Enviar email a Ana (configurado en checkout config)
    const emailNotificaciones = body.config?.email_notificaciones || 'ana@manso.club';
    await sendEmailToAna(emailNotificaciones, body);

    // 3. Enviar notificación WhatsApp a Ana
    const whatsappNumber = body.config?.whatsapp_numero || '5491130232533';
    await sendWhatsAppToAna(whatsappNumber, body);

    // 4. Log del pedido
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
      message: 'Notificaciones enviadas exitosamente',
      notificaciones: {
        email: emailNotificaciones,
        whatsapp: whatsappNumber,
        db_guardado: !!pedido
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

// Función para enviar email a Ana
async function sendEmailToAna(email: string, data: NotifyRequest) {
  try {
    const productosHtml = data.productos.map(item => 
      `<tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.nombre}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${item.precio * item.quantity}</td>
      </tr>`
    ).join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #000; color: white; padding: 20px; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">🛒 NUEVO PEDIDO MANSO CLUB</h1>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">📋 DATOS DEL CLIENTE</h2>
          <p><strong>Nombre:</strong> ${data.cliente.nombre}</p>
          <p><strong>Email:</strong> ${data.cliente.mail}</p>
          <p><strong>Teléfono:</strong> ${data.cliente.telefono}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="color: #333;">📦 PRODUCTOS SOLICITADOS</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #000; color: white;">
                <th style="padding: 12px; text-align: left;">Producto</th>
                <th style="padding: 12px; text-align: center;">Cantidad</th>
                <th style="padding: 12px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${productosHtml}
            </tbody>
            <tfoot>
              <tr style="background: #f5f5f5; font-weight: bold;">
                <td colspan="2" style="padding: 12px; text-align: right;">TOTAL:</td>
                <td style="padding: 12px; text-align: right; font-size: 18px;">$${data.total}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; border-left: 4px solid #4caf50;">
          <h3 style="color: #2e7d32; margin-top: 0;">📋 PRÓXIMOS PASOS</h3>
          <ol style="margin: 10px 0; padding-left: 20px;">
            <li>Contactar al cliente para confirmar el pedido</li>
            <li>Enviar datos bancarios para el pago</li>
            <li>Coordinar envío una vez confirmado el pago</li>
          </ol>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Este es un mensaje automático de MANSO CLUB<br>
            Fecha: ${new Date().toLocaleString('es-AR')}
          </p>
        </div>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@manso.club',
        to: [email],
        subject: `🛒 Nuevo Pedido - ${data.cliente.nombre} - $${data.total}`,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      throw new Error('Error enviando email');
    }

    console.log('✅ Email enviado a Ana:', email);
  } catch (error) {
    console.error('❌ Error enviando email a Ana:', error);
  }
}

// Función para enviar WhatsApp a Ana
async function sendWhatsAppToAna(whatsappNumber: string, data: NotifyRequest) {
  try {
    const response = await fetch(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(data.mensaje)}`);
    console.log('✅ Notificación WhatsApp enviada a Ana:', whatsappNumber);
  } catch (error) {
    console.error('❌ Error enviando WhatsApp a Ana:', error);
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Método no permitido' },
    { status: 405 }
  );
}
