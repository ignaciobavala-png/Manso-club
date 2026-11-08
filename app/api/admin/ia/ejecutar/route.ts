import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { exigirAdmin } from '@/lib/ia';
import { verificarAccion, type Accion } from '@/lib/ia-aprobacion';
import { destinatarioValido, emailEquipo, esImagenPropia, FECHA_LOCAL } from '@/lib/ia-herramientas';
import { getResend, EMAIL_FROM } from '@/lib/resend';

const Mail = z.object({ tipo: z.literal('mail'), datos: z.object({ para: z.string().email(), asunto: z.string().min(1).max(120), texto: z.string().min(1).max(2000) }) });
const Evento = z.object({
  tipo: z.literal('evento'),
  datos: z.object({
    titulo: z.string().min(3).max(120),
    fecha: z.string().regex(FECHA_LOCAL),
    fecha_fin: z.string().regex(FECHA_LOCAL).nullable(),
    descripcion: z.string().max(1500).nullable(),
    categoria: z.string().max(40).nullable(),
    link_tickets: z.string().url().nullable(),
    imagen_url: z.string().url().nullable(),
  }),
});
const Entrada = z.object({ accion: z.discriminatedUnion('tipo', [Mail, Evento]), exp: z.number(), firma: z.string().length(64) });

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const aISO = (local: string) => new Date(`${local}:00-03:00`).toISOString();

/** Ejecuta una acción que la persona aprobó con el botón. Revalida firma, vigencia y datos. */
export async function POST(request: Request) {
  const auth = await exigirAdmin();
  if (!auth.ok) return auth.respuesta;

  const entrada = Entrada.safeParse(await request.json().catch(() => null));
  if (!entrada.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  const { exp, firma } = entrada.data;
  const accion = entrada.data.accion as Accion;

  if (!verificarAccion(auth.userId, accion, exp, firma)) {
    return NextResponse.json({ error: 'La propuesta venció o no es válida. Pedísela de nuevo al asistente.' }, { status: 400 });
  }

  const log = (evento: 'ejecutado' | 'error', detalle: object) =>
    auth.supabase.from('ai_agent_log').insert({ user_id: auth.userId, evento, herramienta: accion.tipo === 'mail' ? 'proponer_mail' : 'proponer_evento', detalle });

  try {
    if (accion.tipo === 'mail') {
      const p = accion.datos;
      if (!(await destinatarioValido(auth.supabase, p.para, emailEquipo(auth.email)))) {
        return NextResponse.json({ error: 'Destinatario no válido.' }, { status: 400 });
      }
      const html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#111">${esc(p.texto).replace(/\n/g, '<br>')}</div>`;
      const { error } = await getResend().emails.send({ from: EMAIL_FROM, to: p.para, subject: p.asunto, text: p.texto, html });
      if (error) throw new Error(error.message);
      await log('ejecutado', { para: p.para, asunto: p.asunto });
    } else {
      const d = accion.datos;
      if (d.imagen_url && !esImagenPropia(d.imagen_url)) {
        return NextResponse.json({ error: 'Imagen no válida.' }, { status: 400 });
      }
      const { data, error } = await auth.supabase.from('eventos').insert({
        titulo: d.titulo, fecha: aISO(d.fecha), fecha_fin: d.fecha_fin ? aISO(d.fecha_fin) : null,
        descripcion: d.descripcion, categoria: d.categoria, link_tickets: d.link_tickets,
        imagen_url: d.imagen_url, disponible: true, activo: true, orden: 0,
      }).select('id').single();
      if (error) throw new Error(error.message);
      revalidatePath('/agenda');
      revalidatePath('/');
      await log('ejecutado', { evento_id: data.id, titulo: d.titulo });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[ia/ejecutar]', err instanceof Error ? err.message : err);
    await log('error', { tipo: accion.tipo });
    return NextResponse.json({ error: accion.tipo === 'mail' ? 'No se pudo enviar el mail.' : 'No se pudo crear el evento.' }, { status: 502 });
  }
}
