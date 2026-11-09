import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { firmarAccion, type AccionFirmada } from '@/lib/ia-aprobacion';

export const MAX_PROPUESTAS = 5;

/** Las fotos del chat se suben al bucket público "flyers"; no se acepta ninguna otra URL de imagen. */
export function esImagenPropia(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!base && url.startsWith(`${base}/storage/v1/object/public/flyers/`);
}

export const FECHA_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;


/**
 * Tablas que el asistente puede leer con leer_tabla. Quedan afuera a propósito
 * las que guardan datos de cobro o conversaciones privadas (checkout_config,
 * festival_cripto_*, chat_mensajes, chat_reacciones, festival_clicks/visitas).
 */
const TABLAS_LEGIBLES = [
  'user_profiles', 'membresias', 'membresia_beneficios', 'user_membresias_activas', 'membresias_config',
  'cowork_fechas', 'cowork_solicitudes', 'propuestas', 'ofertas_empleo',
  'agenda', 'agenda_inscripciones', 'eventos', 'eventos_home', 'artistas', 'artistas_tracks',
  'productos', 'pedidos', 'ordenes', 'tickets', 'cotizaciones',
  'festival_plan_tareas', 'festival_plan_hitos',
  'festival_config', 'festival_artistas', 'festival_escenarios', 'festival_entradas', 'festival_ordenes',
  'festival_tickets', 'festival_spots', 'festival_faq', 'festival_lanchas', 'festival_voluntarios',
  'foro_threads', 'foro_replies', 'foro_categorias', 'foro_reportes',
  'mailing_campanias', 'mailing_envios', 'mailing_exclusiones', 'newsletter_suscriptores',
  'streaming_contenido', 'streaming_categorias', 'multimedia_videos', 'gallery_images', 'hero_config',
  'team_members', 'espacio_salas', 'espacio_config', 'cultura_config', 'cultura_bloques', 'about_us', 'manifiesto',
  'chat_salas', 'chat_miembros', 'ai_agent_log',
] as const;

const COLUMNA_SENSIBLE = /token|secret|password|api_?key|hash|cbu|wallet|private/i;

function recortar(valor: unknown): unknown {
  if (typeof valor === 'string') return valor.length > 300 ? `${valor.slice(0, 300)}…` : valor;
  if (Array.isArray(valor)) return valor.slice(0, 20).map(recortar);
  if (valor && typeof valor === 'object') return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, recortar(v)]));
  return valor;
}

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
  const propuestasEmitidas: AccionFirmada[] = [];

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

    plan_festival: tool({
      description: 'Plan interno de producción del festival BLUR (12 de diciembre): tareas con área, responsable, estado, prioridad, deadline y notas, más los hitos. Es una foto de la planilla del 08/11/2026. Usala para "qué falta", "qué tiene X", "qué está atrasado", "cómo va producción".',
      inputSchema: z.object({
        area: z.enum(['Comercial y Sponsors', 'Comunicación', 'Diseño', 'Desarrollo', 'Artística', 'Producción', 'Legal y Finanzas']).optional(),
        estado: z.enum(['Pendiente', 'En curso', 'Hecho', 'Stand by', 'Cotizando']).optional(),
        responsable: z.string().max(40).optional().describe('Nombre o parte (Ana, Kike, Porti, Fran, Agus, Mati, Julia, Nacho…). Una tarea puede tener varios responsables.'),
        texto: z.string().max(60).optional().describe('Palabra a buscar en el nombre de la tarea.'),
        solo_atrasadas: z.boolean().default(false).describe('Deadline ya vencido y sin estar Hecho.'),
        incluir_hitos: z.boolean().default(false),
        limite: z.number().int().min(1).max(40).default(25),
      }),
      execute: async ({ area, estado, responsable, texto, solo_atrasadas, incluir_hitos, limite }) => {
        const limpio = (s: string) => s.replace(/[%,()]/g, ' ').trim();
        let q = supabase
          .from('festival_plan_tareas')
          .select('id, area, frente, tarea, responsable, estado, prioridad, next_step, entregable, deadline, notas')
          .order('deadline', { ascending: true, nullsFirst: false })
          .limit(limite);
        if (area) q = q.eq('area', area);
        if (estado) q = q.eq('estado', estado);
        if (responsable && limpio(responsable)) q = q.ilike('responsable', `%${limpio(responsable)}%`);
        if (texto && limpio(texto)) q = q.ilike('tarea', `%${limpio(texto)}%`);
        if (solo_atrasadas) {
          const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
          q = q.lt('deadline', hoy).or('estado.is.null,estado.neq.Hecho');
        }
        const { data, error } = await q;
        if (error) return { error: 'No se pudo consultar el plan del festival.' };
        const filas = (data ?? []).map(f => Object.fromEntries(Object.entries(f).filter(([, v]) => v !== null).map(([k, v]) => [k, recortar(v)])));
        const res: Record<string, unknown> = { cantidad: filas.length, tareas: filas };
        if (incluir_hitos) {
          const { data: hitos } = await supabase.from('festival_plan_hitos').select('fecha, hito, tipo, tareas').order('fecha');
          res.hitos = hitos ?? [];
        }
        return res;
      },
    }),

    ver_tablas: tool({
      description: 'Lista las tablas del sistema que se pueden leer con leer_tabla. Usala si no sabés en qué tabla está un dato.',
      inputSchema: z.object({}),
      execute: async () => ({ tablas: TABLAS_LEGIBLES }),
    }),

    leer_tabla: tool({
      description: 'Lee filas de cualquier tabla de ver_tablas (eventos, agenda, productos, pedidos, artistas, foro, festival, etc.). Devuelve hasta 25 filas. Se puede filtrar por igualdad en una columna y ordenar. Si no conocés las columnas, pedí pocas filas y mirá el resultado.',
      inputSchema: z.object({
        tabla: z.enum(TABLAS_LEGIBLES),
        filtro_columna: z.string().regex(/^[a-z_]+$/).optional(),
        filtro_valor: z.union([z.string(), z.number(), z.boolean()]).optional(),
        ordenar_por: z.string().regex(/^[a-z_]+$/).optional().describe('Columna para ordenar, descendente (ej: created_at, fecha).'),
        limite: z.number().int().min(1).max(25).default(15),
      }),
      execute: async ({ tabla, filtro_columna, filtro_valor, ordenar_por, limite }) => {
        let q = supabase.from(tabla).select('*').limit(limite);
        if (filtro_columna && filtro_valor !== undefined) q = q.eq(filtro_columna, filtro_valor);
        if (ordenar_por) q = q.order(ordenar_por, { ascending: false });
        const { data, error } = await q;
        if (error) return { error: `No se pudo leer ${tabla}: ${error.message.slice(0, 120)}` };
        const filas = (data ?? []).map(f =>
          Object.fromEntries(Object.entries(f).filter(([k]) => !COLUMNA_SENSIBLE.test(k)).map(([k, v]) => [k, recortar(v)])),
        );
        return { tabla, cantidad: filas.length, filas };
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
        propuestasEmitidas.push(firmarAccion(userId, { tipo: 'mail', datos: { para: destino, asunto: asunto.trim(), texto: texto.trim() } }));
        return { ok: true, mensaje: 'Borrador listo; la persona decide si lo envía.' };
      },
    }),

    proponer_evento: tool({
      description: 'Deja armado un evento nuevo para que la persona lo revise y lo cree con un botón. NO crea nada. Usalo cuando pidan cargar/crear un evento. Si falta título o fecha, preguntá antes.',
      inputSchema: z.object({
        titulo: z.string().min(3).max(120),
        fecha: z.string().regex(FECHA_LOCAL).describe('Inicio, hora de Buenos Aires, formato 2026-11-22T16:00'),
        fecha_fin: z.string().regex(FECHA_LOCAL).optional().describe('Fin, mismo formato. Solo si te lo dijeron.'),
        descripcion: z.string().max(1500).optional().describe('Solo con lo que dijeron; no inventes detalles.'),
        categoria: z.enum(['Concierto', 'Festival', 'Workshop', 'Exposición', 'Show', 'Torneo', 'Otro']).optional(),
        link_tickets: z.string().url().optional(),
        imagen_url: z.string().url().optional().describe('URL de la foto adjunta en el chat ("[Foto adjunta: URL]"). Copiala tal cual.'),
      }),
      execute: async (e) => {
        if (propuestasEmitidas.length >= MAX_PROPUESTAS) return { error: `Máximo ${MAX_PROPUESTAS} acciones por respuesta.` };
        if (e.imagen_url && !esImagenPropia(e.imagen_url)) return { error: 'Esa imagen no es una foto subida desde el chat.' };
        const inicio = new Date(`${e.fecha}:00-03:00`);
        if (isNaN(inicio.getTime())) return { error: 'Fecha inválida.' };
        if (e.fecha_fin && new Date(`${e.fecha_fin}:00-03:00`) < inicio) return { error: 'El fin es anterior al inicio.' };
        propuestasEmitidas.push(firmarAccion(userId, {
          tipo: 'evento',
          datos: {
            titulo: e.titulo.trim(), fecha: e.fecha, fecha_fin: e.fecha_fin ?? null,
            descripcion: e.descripcion?.trim() || null, categoria: e.categoria ?? null,
            link_tickets: e.link_tickets ?? null, imagen_url: e.imagen_url ?? null,
          },
        }));
        return { ok: true, mensaje: 'Evento listo para revisar; la persona decide si lo crea.' };
      },
    }),
  };

  return { herramientas, propuestasEmitidas, equipo };
}
