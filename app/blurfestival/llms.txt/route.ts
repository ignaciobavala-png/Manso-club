import { leerConfig } from '@/lib/festival';
import { fichaFestival } from '@/lib/festival-ficha';

/**
 * /blurfestival/llms.txt — la ficha del festival para asistentes de IA (ChatGPT,
 * Claude, Perplexity, Gemini). Es el detalle de lo que /llms.txt resume en una
 * línea: fecha, lugar, line-up, entradas con precio y preguntas frecuentes, en
 * markdown plano para que un agente conteste "¿cuándo es BLUR?" o "¿cuánto
 * sale la entrada?" sin parsear el HTML.
 *
 * El texto lo arma `fichaFestival` (lo comparte con el chat del sitio). Sale de
 * las mismas lecturas que la web, así que respeta el RLS: sin publicar, la
 * config vuelve vacía y esto responde 404.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const config = await leerConfig();
  if (!config?.publicado) return new Response('No encontrado', { status: 404 });

  return new Response(await fichaFestival(config), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
    },
  });
}
