import { createSupabaseAnon } from './supabase';
import { nanoid } from 'nanoid';

// Interfaz para configuración de MP
interface MPConfig {
  access_token: string;
  public_key: string;
  modo_sandbox: boolean;
}

// Función para obtener cliente de Mercado Pago configurado
export async function getMP() {
  try {
    const supabase = createSupabaseAnon();
    const { data: configs, error: configError } = await supabase
      .from('configuracion')
      .select('clave, valor')
      .in('clave', ['mp_access_token', 'mp_public_key', 'mp_modo_sandbox']);

    if (configError) {
      throw new Error('Error leyendo configuración de Mercado Pago');
    }

    if (!configs || configs.length < 2) {
      throw new Error('Configuración de Mercado Pago incompleta');
    }

    const config: Partial<MPConfig> = {};
    configs.forEach(item => {
      switch (item.clave) {
        case 'mp_access_token':
          config.access_token = item.valor;
          break;
        case 'mp_public_key':
          config.public_key = item.valor;
          break;
        case 'mp_modo_sandbox':
          config.modo_sandbox = item.valor === 'true';
          break;
      }
    });

    if (!config.access_token) {
      throw new Error('Access Token no configurado');
    }

    // Importar y configurar Mercado Pago SDK
    const { MercadoPagoConfig, Preference } = await import('mercadopago');
    
    const client = new MercadoPagoConfig({
      accessToken: config.access_token,
      options: {
        timeout: 5000,
        idempotencyKey: nanoid(),
      },
    });

    return {
      client,
      config: config as MPConfig,
      Preference,
    };

  } catch (error) {
    console.error('Error configurando Mercado Pago:', error);
    throw error;
  }
}

// Función para obtener configuración pública (solo para frontend)
export async function getPublicConfig() {
  try {
    const supabase = createSupabaseAnon();
    const { data: configs, error: configError } = await supabase
      .from('configuracion')
      .select('clave, valor')
      .in('clave', ['mp_public_key', 'mp_modo_sandbox']);

    if (configError) {
      throw new Error('Error leyendo configuración pública');
    }

    const public_key = configs?.find(c => c.clave === 'mp_public_key')?.valor || '';
    const modo_sandbox = configs?.find(c => c.clave === 'mp_modo_sandbox')?.valor === 'true';

    return {
      public_key,
      modo: modo_sandbox ? 'sandbox' : 'production',
    };

  } catch (error) {
    console.error('Error obteniendo configuración pública:', error);
    throw error;
  }
}

// Función placeholder para enviar emails de tickets
export async function sendTicketEmail(ordenId: number) {
  try {
    const supabase = createSupabaseAnon();
    
    // Obtener tickets de la orden
    const { data: tickets } = await supabase
      .from('tickets')
      .select(`
        *,
        ordenes (
          email,
          nombre,
          created_at,
          total
        )
      `)
      .eq('orden_id', ordenId);

    if (!tickets || tickets.length === 0) {
      console.log('No se encontraron tickets para la orden:', ordenId);
      return;
    }

    const orden = tickets[0].ordenes;
    
    console.log(`📧 Enviando tickets para orden ${ordenId}:`);
    console.log(`   Para: ${orden.nombre} (${orden.email})`);
    console.log(`   Cantidad: ${tickets.length} tickets`);
    console.log(`   Total: $${orden.total}`);
    
    // Listar tickets
    tickets.forEach((ticket, index) => {
      console.log(`   ${index + 1}. ${ticket.codigo} - ${ticket.evento_nombre}`);
    });

    // TODO: Implementar servicio de email real
    // Opciones recomendadas:
    // - Resend (https://resend.com)
    // - SendGrid (https://sendgrid.com)
    // - Nodemailer con SMTP propio
    
    // Ejemplo de implementación futura:
    /*
    import { Resend } from 'resend';
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: 'tickets@manso.club',
      to: [orden.email],
      subject: `Tus tickets para Manso Club`,
      react: TicketEmailTemplate({ tickets, orden }),
    });
    */

  } catch (error) {
    console.error('Error enviando email de tickets:', error);
    throw error;
  }
}

// Función para generar código único de ticket
export function generateTicketCode(): string {
  return nanoid(10).toUpperCase();
}

// Función para validar formato de código
export function isValidTicketCode(code: string): boolean {
  return /^[A-Z0-9]{10}$/.test(code.toUpperCase());
}

// Función para obtener URLs de Mercado Pago según el modo
export function getMPUrls(modoSandbox: boolean) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://manso.club');

  return {
    success: `${baseUrl}/checkout/success`,
    failure: `${baseUrl}/checkout/failure`,
    pending: `${baseUrl}/checkout/pending`,
    webhook: `${baseUrl}/api/mp/webhook`,
  };
}
