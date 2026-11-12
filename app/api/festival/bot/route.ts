import { NextResponse } from 'next/server';
import { generateText, type ModelMessage } from 'ai';
import { z } from 'zod';
import { getModeloIA } from '@/lib/ia';
import { leerConfig } from '@/lib/festival';
import { leerIdioma } from '@/lib/festival-idioma-servidor';
import { LIMITES_BOT, fichaBot, frenoBot, promptBot, registrarConsulta } from '@/lib/festival-bot';

/**
 * El chat público de /blurfestival. Recibe la charla, arma la ficha con lo
 * público y devuelve la respuesta entera (el "se está escribiendo" es un efecto
 * del navegador, ver `BotBlur`).
 *
 * Es el único endpoint de IA sin login, así que el orden importa: todo lo que
 * puede rechazar el pedido (forma, largo, festival sin publicar, freno de uso)
 * corre ANTES de gastar un token.
 */
export const maxDuration = 30;

const Entrada = z.object({
  sesion: z.string().uuid().optional(),
  mensajes: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        // Las respuestas del bot vuelven en el historial y son más largas que una pregunta.
        content: z.string().min(1).max(2000),
      })
    )
    .min(1)
    .max(30),
});

/** El navegador traduce el código: acá no hay copy. */
const error = (codigo: 'invalido' | 'limite' | 'no-disponible', status: number) =>
  NextResponse.json({ error: codigo }, { status });

export async function POST(request: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return error('invalido', 400);
  }
  const entrada = Entrada.safeParse(cuerpo);
  if (!entrada.success) return error('invalido', 400);

  const mensajes = entrada.data.mensajes.slice(-LIMITES_BOT.historial);
  // El recorte puede dejar una respuesta suelta adelante: la charla que ve el
  // modelo arranca siempre con una pregunta.
  while (mensajes.length > 1 && mensajes[0].role === 'assistant') mensajes.shift();
  const ultimo = mensajes[mensajes.length - 1];
  const pregunta = ultimo.content.trim();
  if (ultimo.role !== 'user' || !pregunta || pregunta.length > LIMITES_BOT.largoPregunta) return error('invalido', 400);

  // Sin publicar, el RLS no devuelve la config (o es un admin mirando el
  // borrador): el chat no existe todavía.
  const config = await leerConfig();
  if (!config?.publicado) return error('no-disponible', 404);
  if (!process.env.DEEPSEEK_API_KEY) return error('no-disponible', 503);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'sin-ip';
  const freno = await frenoBot(ip);
  if (freno === 'limite') return error('limite', 429);
  if (freno === 'caido') return error('no-disponible', 503);

  const idioma = await leerIdioma();
  const sesion = entrada.data.sesion ?? null;
  const hoy = new Intl.DateTimeFormat('es-AR', { dateStyle: 'full', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
  const contacto = [config.email, config.instagram && `Instagram @${config.instagram.replace(/^@/, '')}`].filter(Boolean).join(' o ') || 'los canales de Manso Club';

  try {
    const result = await generateText({
      model: getModeloIA(),
      system: promptBot({ hoy, ficha: await fichaBot(config), contacto }),
      messages: mensajes as ModelMessage[],
      providerOptions: { deepseek: { thinking: { type: 'disabled' } } },
      temperature: 0.2,
      maxOutputTokens: 500,
      abortSignal: request.signal,
    });

    const respuesta = result.text.trim();
    if (!respuesta) throw new Error('respuesta vacía');

    await registrarConsulta({ sesion, idioma, pregunta, respuesta });
    return NextResponse.json({ respuesta });
  } catch (err) {
    console.error('[festival/bot]', err instanceof Error ? err.message : err);
    await registrarConsulta({ sesion, idioma, pregunta, respuesta: null });
    return error('no-disponible', 502);
  }
}
