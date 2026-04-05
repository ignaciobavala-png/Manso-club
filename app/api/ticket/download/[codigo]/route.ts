import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAnon } from '../../../../../lib/supabase';
import QRCode from 'qrcode';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await context.params;

    // Buscar ticket por código
    const supabase = createSupabaseAnon();
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        *,
        ordenes (
          created_at,
          total
        )
      `)
      .eq('codigo', codigo.toUpperCase())
      .single();

    if (error || !ticket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      );
    }

    // Generar QR code
    const qrDataUrl = await QRCode.toDataURL(codigo, {
      width: 300,
      margin: 3,
      color: {
        dark: '#1D1D1B',
        light: '#F5E6D3',
      },
    });

    // Crear una imagen simple con el QR y la información
    const canvas = new (require('canvas').Canvas)(600, 800);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1D1D1B';
    ctx.fillRect(0, 0, 600, 800);

    // Header
    ctx.fillStyle = '#F5E6D3';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Manso Club', 300, 60);

    ctx.font = '14px Arial';
    ctx.fillText('Ticket Digital', 300, 90);

    // Event name
    ctx.font = 'bold 24px Arial';
    ctx.fillText(ticket.evento_nombre, 300, 140);

    // Info
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Nombre: ${ticket.nombre}`, 50, 200);
    ctx.fillText(`Email: ${ticket.email}`, 50, 230);
    ctx.fillText(`Fecha: ${new Date(ticket.ordenes.created_at).toLocaleDateString('es-AR')}`, 50, 260);
    ctx.fillText(`Total: $${ticket.ordenes.total}`, 50, 290);

    // Código
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Código: ${codigo}`, 300, 350);

    // QR Code (simplificado - en producción se integraría mejor)
    ctx.fillStyle = '#F5E6D3';
    ctx.font = '14px Arial';
    ctx.fillText('Escanear QR para validar', 300, 400);

    // Footer
    ctx.font = '12px Arial';
    ctx.fillText('www.manso.club', 300, 750);

    // Convertir a buffer
    const buffer = canvas.toBuffer('image/png');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="ticket-${codigo}.png"`,
      },
    });

  } catch (error) {
    console.error('Error generando ticket:', error);
    return NextResponse.json(
      { error: 'Error generando ticket' },
      { status: 500 }
    );
  }
}
