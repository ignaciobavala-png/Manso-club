import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { firmarPropuesta, type PropuestaMail } from '@/lib/ia-aprobacion';

export const MAX_PROPUESTAS = 5;

/** Mail del equipo (Ana). Si no está configurado, el de la persona que usa el panel. */
export function emailEquipo(emailSesion: string | null): string | null {
  return process.env.IA_AVISOS_EMAIL || emailSesion;
}

/**
 * Un destinatario es válido si ya figura en el sistema o es el equipo. Se
 * comprueba al proponer Y al ejecutar: el modelo no puede mandar mails a
 * direcciones sueltas.
 */
export async function destinatarioValido(supabase: SupabaseClient, para: string, equipo: string | null): Promise<boolean> {
  const mail = para.trim().toLowerCase();
  if (equipo && mail === equipo.toLowerCase()) return true;
  const fuentes = ['user_profiles', 'cowork_solicitudes', 'propuestas'] as const;
  for (const tabla of fuentes) {
    const { data } = await supabase.from(tabla).select('email').ilike('email', mail).limit(1);
    if (data && data.length > 0) return true;
  }
  return false;
}

/**
 * Herramientas del asistente. Las de lectura corren con la sesión del admin
 * (RLS sigue mandando), con columnas explícitas y topes de filas.
 */
export function crearHerramientas(ctx: { supabase: SupabaseClient; userId: string; email: string | null }) {
  const { supabase, userId } = ctx;
  const equipo = emailEquipo(ctx.email);
  const propuestasEmitidas: ReturnType<typeof firmarPropuesta>[] = [];

  const herramientas = {
    membresias: tool({
      description: 'Lista membresías vencidas o por vencer. Devuelve nombre, mail, tipo y fecha de vencimiento.',
      inputSchema: z.object({
        estado: z.enum(['vencidas', 'por_vencer', 'activas']).describe('vencidas: ya pasó la fecha; por_vencer: vence en los próximos N días; activas: vigentes'),
        dias: z.number().int().min(1).max(60).default(7).describe('Ventana para por_vencer'),
      }),
      execute: async ({ estado, dias }) => {
        const ahora = new Date();
        let q = supabase
          .from('user_profiles')
          .select('display_name, email, membresia_tipo, membresia_hasta, membresia_activa')
          .order('membresia_hasta', { ascending: true })
          .limit(30);
        if (estado === 'vencidas') q = q.lt('membresia_hasta', ahora.toISOString());
        else if (estado === 'por_vencer') {
          q = q.gte('membresia_hasta', ahora.toISOString()).lte('membresia_hasta', new Date(ahora.getTime() + dias * 864e5).toISOString());
        } else q = q.eq('membresia_activa', true);
        const { data, error } = await q;
        if (error) return { error: 'No se pudo consultar las membresías.' };
        return { cantidad: data.length, personas: data };
      },
    }),

    solicitudes_cowork: tool({
      description: 'Solicitudes de inscripción al cowork (membresía u Open Cowork). Por defecto, las pendientes.',
      inputSchema: z.object({ estado: z.enum(['pendiente', 'aprobado', 'rechazado']).default('pendiente') }),
      execute: async ({ estado }) => {
        const { data, error } = await supabase
          .from('cowork_solicitudes')
          .select('nombre, email, whatsapp, dedicacion, proyecto, busca, origen, membresia_nombre, estado, created_at')
          .eq('estado', estado)
          .order('created_at', { ascending: false })
          .limit(20);
        if (error) return { error: 'No se pudo consultar las solicitudes.' };
        return { cantidad: data.length, solicitudes: data };
      },
    }),

    propuestas: tool({
      description: 'Propuestas de artistas, talleres o residencias que mandó la gente desde el sitio. Por defecto, las no revisadas.',
      inputSchema: z.object({ solo_sin_revisar: z.boolean().default(true) }),
      execute: async ({ solo_sin_revisar }) => {
        let q = supabase
          .from('propuestas')
          .select('nombre, email, tipo, descripcion, links, revisado, created_at')
          .order('created_at', { ascending: false })
          .limit(20);
        if (solo_sin_revisar) q = q.eq('revisado', false);
        const { data, error } = await q;
        if (error) return { error: 'No se pudo consultar las propuestas.' };
        return { cantidad: data.length, propuestas: data };
      },
    }),

    ofertas_empleo: tool({
      description: 'Ofertas de empleo publicadas en el sitio.',
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase.from('ofertas_empleo').select('area, descripcion, activo').order('orden').limit(30);
        if (error) return { error: 'No se pudo consultar las ofertas.' };
        return { ofertas: data };
      },
    }),

    proponer_mail: tool({
      description: 'Deja armado un mail para que la persona del equipo lo revise y lo envíe con un botón. NO envía nada. para: un mail que figure en el sistema, o "equipo" para avisar al equipo.',
      inputSchema: z.object({
        para: z.string().describe('Mail del destinatario, o "equipo".'),
        asunto: z.string().min(3).max(120),
        texto: z.string().min(10).max(2000).describe('Texto plano, español rioplatense, firmado "Equipo de Manso Club".'),
      }),
      execute: async ({ para, asunto, texto }) => {
        if (propuestasEmitidas.length >= MAX_PROPUESTAS) return { error: `Máximo ${MAX_PROPUESTAS} mails por respuesta.` };
        const destino = para.trim().toLowerCase() === 'equipo' ? equipo : para.trim();
        if (!destino) return { error: 'No hay mail del equipo configurado.' };
        if (!(await destinatarioValido(supabase, destino, equipo))) {
          return { error: 'Ese mail no figura en el sistema. Solo se puede escribir a miembros, solicitantes, proponentes o al equipo.' };
        }
        const p: PropuestaMail = { para: destino, asunto: asunto.trim(), texto: texto.trim() };
        const firmada = firmarPropuesta(userId, p);
        propuestasEmitidas.push(firmada);
        return { ok: true, mensaje: 'Borrador listo; la persona decide si lo envía.' };
      },
    }),
  };

  return { herramientas, propuestasEmitidas, equipo };
}
