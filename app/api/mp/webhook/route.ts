import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAnon } from '../../../../lib/supabase';
import { nanoid } from 'nanoid';

interface WebhookNotification {
  type: string;
  data: {
    id: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: WebhookNotification = await request.json();
    const { type, data } = body;

    console.log('Webhook recibido:', { type, data });

    // Solo procesar notificaciones de pago
    if (type !== 'payment') {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Leer credenciales desde configuración
    const supabase = createSupabaseAnon();
    const { data: config, error: configError } = await supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', 'mp_access_token')
      .single();

    if (configError || !config?.valor) {
      console.error('Access Token no configurado');
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const accessToken = config.valor;

    // Consultar información del pago a Mercado Pago
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!paymentResponse.ok) {
      console.error('Error consultando pago:', paymentResponse.status);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const payment = await paymentResponse.json();
    console.log('Datos del pago:', {
      id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
      external_reference: payment.external_reference,
      order_id: payment.order?.id,
    });

    // Buscar orden por external_reference
    const ordenId = payment.external_reference;
    if (!ordenId) {
      console.error('No se encontró external_reference en el pago');
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Actualizar orden según estado del pago
    if (payment.status === 'approved') {
      // Actualizar orden a pagada
      const { error: updateError } = await supabase
        .from('ordenes')
        .update({
          estado: 'pagada',
          mp_payment_id: payment.id.toString(),
        })
        .eq('id', parseInt(ordenId));

      if (updateError) {
        console.error('Error actualizando orden:', updateError);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Obtener items de la orden para generar tickets
      const { data: ordenItems, error: itemsError } = await supabase
        .from('orden_items')
        .select('*')
        .eq('orden_id', parseInt(ordenId));

      if (itemsError) {
        console.error('Error obteniendo items:', itemsError);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Obtener datos de la orden para el ticket
      const { data: orden, error: ordenError } = await supabase
        .from('ordenes')
        .select('*')
        .eq('id', parseInt(ordenId))
        .single();

      if (ordenError || !orden) {
        console.error('Error obteniendo orden:', ordenError);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Generar tickets para cada item
      for (const item of ordenItems || []) {
        const codigo = nanoid(10).toUpperCase();
        
        // Determinar nombre del evento/producto
        let eventoNombre = item.nombre;
        if (item.tipo === 'entrada' && item.referencia_id) {
          // Si es entrada, intentar obtener el nombre del evento
          const { data: evento } = await supabase
            .from('agenda')
            .select('titulo')
            .eq('id', item.referencia_id)
            .single();
          
          if (evento) {
            eventoNombre = evento.titulo;
          }
        }

        const { error: ticketError } = await supabase
          .from('tickets')
          .insert({
            orden_id: parseInt(ordenId),
            orden_item_id: item.id,
            email: orden.email,
            nombre: orden.nombre,
            codigo,
            tipo: item.tipo,
            evento_nombre: eventoNombre,
            usado: false,
          });

        if (ticketError) {
          console.error('Error creando ticket:', ticketError);
        } else {
          console.log(`Ticket creado: ${codigo} para ${item.nombre}`);
        }
      }

      // Enviar emails con tickets (placeholder por ahora)
      await sendTicketEmails(parseInt(ordenId));

      console.log(`Orden ${ordenId} procesada correctamente con pago aprobado`);

    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      // Actualizar orden a rechazada
      await supabase
        .from('ordenes')
        .update({
          estado: 'rechazada',
          mp_payment_id: payment.id.toString(),
        })
        .eq('id', parseInt(ordenId));

      console.log(`Orden ${ordenId} rechazada/cancelada`);

    } else if (payment.status === 'in_process' || payment.status === 'pending') {
      // Actualizar orden a pendiente
      await supabase
        .from('ordenes')
        .update({
          estado: 'pendiente',
          mp_payment_id: payment.id.toString(),
        })
        .eq('id', parseInt(ordenId));

      console.log(`Orden ${ordenId} en proceso/pendiente`);
    }

    // Siempre devolver 200 OK (requisito de Mercado Pago)
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('Error procesando webhook:', error);
    // Siempre devolver 200 OK para no reintentos
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

// Función placeholder para enviar emails (se implementará después)
async function sendTicketEmails(ordenId: number) {
  try {
    const supabase = createSupabaseAnon();
    
    // Obtener tickets de la orden
    const { data: tickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('orden_id', ordenId);

    // Obtener datos de la orden
    const { data: orden } = await supabase
      .from('ordenes')
      .select('*')
      .eq('id', ordenId)
      .single();

    if (!tickets || !orden) {
      console.error('No se encontraron tickets u orden para enviar email');
      return;
    }

    console.log(`📧 Enviando ${tickets.length} tickets a ${orden.email}`);
    
    // Placeholder: Aquí se implementará el envío real de emails
    tickets.forEach(ticket => {
      console.log(`  - Ticket ${ticket.codigo}: ${ticket.evento_nombre}`);
    });

    // TODO: Implementar servicio de email real
    // await emailService.sendTickets(orden.email, tickets);
    
  } catch (error) {
    console.error('Error enviando emails de tickets:', error);
  }
}
