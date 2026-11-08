import { NextResponse } from 'next/server';
import { generateText, stepCountIs, type ModelMessage } from 'ai';
import { z } from 'zod';
import { exigirAdmin, getModeloIA } from '@/lib/ia';
import { crearHerramientas } from '@/lib/ia-herramientas';
import { promptAsistente } from '@/lib/ia-prompt';

export const maxDuration = 60;

const Entrada = z.object({
  mensajes: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(4000),
  })).min(1).max(20),
});

export async function POST(request: Request) {
  const auth = await exigirAdmin();
  if (!auth.ok) return auth.respuesta;

  let cuerpo: unknown;
  try { cuerpo = await request.json(); } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }
  const entrada = Entrada.safeParse(cuerpo);
  if (!entrada.success) return NextResponse.json({ error: 'Mensaje inválido' }, { status: 400 });
  if (entrada.data.mensajes[entrada.data.mensajes.length - 1].role !== 'user') return NextResponse.json({ error: 'Mensaje inválido' }, { status: 400 });

  const { herramientas, propuestasEmitidas, equipo } = crearHerramientas({
    supabase: auth.supabase, userId: auth.userId, email: auth.email,
  });

  const hoy = new Intl.DateTimeFormat('es-AR', { dateStyle: 'full', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());

  try {
    const { data: perfil } = await auth.supabase.from('user_profiles').select('display_name').eq('id', auth.userId).maybeSingle();
    const result = await generateText({
      model: getModeloIA(),
      system: promptAsistente({ hoy, persona: perfil?.display_name || auth.email, emailEquipo: equipo ?? 'el mail de la persona que te habla' }),
      messages: entrada.data.mensajes as ModelMessage[],
      tools: herramientas,
      stopWhen: stepCountIs(6),
      providerOptions: { deepseek: { thinking: { type: 'disabled' } } },
      temperature: 0.3,
      maxOutputTokens: 1200,
      abortSignal: request.signal,
    });

    const usadas = result.steps.flatMap(s => s.toolCalls.map(c => c.toolName));
    await auth.supabase.from('ai_agent_log').insert({
      user_id: auth.userId,
      evento: propuestasEmitidas.length ? 'propuesta' : 'consulta',
      herramienta: usadas.join(',') || null,
      detalle: { pregunta: entrada.data.mensajes[entrada.data.mensajes.length - 1].content.slice(0, 300), propuestas: propuestasEmitidas.map(p => `${p.accion.tipo}:${p.accion.tipo === 'mail' ? p.accion.datos.para : p.accion.datos.titulo}`) },
    });

    return NextResponse.json({
      respuesta: result.text || 'No pude armar una respuesta. Probá reformular la pregunta.',
      propuestas: propuestasEmitidas,
    });
  } catch (err) {
    console.error('[ia/asistente]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'El asistente no pudo responder ahora. Probá de nuevo en un momento.' }, { status: 502 });
  }
}
