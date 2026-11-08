import { NextResponse } from 'next/server';
import { z } from 'zod';
import { exigirAdmin } from '@/lib/ia';
import { verificarPropuesta } from '@/lib/ia-aprobacion';
import { destinatarioValido, emailEquipo } from '@/lib/ia-herramientas';
import { getResend, EMAIL_FROM } from '@/lib/resend';

const Entrada = z.object({
  propuesta: z.object({ para: z.string().email(), asunto: z.string().min(1).max(120), texto: z.string().min(1).max(2000) }),
  exp: z.number(),
  firma: z.string().length(64),
});

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Envía un mail que la persona aprobó con el botón. Revalida firma, vigencia y destinatario. */
export async function POST(request: Request) {
  const auth = await exigirAdmin();
  if (!auth.ok) return auth.respuesta;

  const entrada = Entrada.safeParse(await request.json().catch(() => null));
  if (!entrada.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  const { propuesta, exp, firma } = entrada.data;

  if (!verificarPropuesta(auth.userId, propuesta, exp, firma)) {
    return NextResponse.json({ error: 'La propuesta venció o no es válida. Pedísela de nuevo al asistente.' }, { status: 400 });
  }
  if (!(await destinatarioValido(auth.supabase, propuesta.para, emailEquipo(auth.email)))) {
    return NextResponse.json({ error: 'Destinatario no válido.' }, { status: 400 });
  }

  try {
    const html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#111">${esc(propuesta.texto).replace(/\n/g, '<br>')}</div>`;
    const { error } = await getResend().emails.send({
      from: EMAIL_FROM, to: propuesta.para, subject: propuesta.asunto, text: propuesta.texto, html,
    });
    if (error) throw new Error(error.message);
    await auth.supabase.from('ai_agent_log').insert({
      user_id: auth.userId, evento: 'ejecutado', herramienta: 'proponer_mail',
      detalle: { para: propuesta.para, asunto: propuesta.asunto },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[ia/ejecutar]', err instanceof Error ? err.message : err);
    await auth.supabase.from('ai_agent_log').insert({
      user_id: auth.userId, evento: 'error', herramienta: 'proponer_mail', detalle: { para: propuesta.para },
    });
    return NextResponse.json({ error: 'No se pudo enviar el mail.' }, { status: 502 });
  }
}
