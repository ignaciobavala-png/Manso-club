import { fichaManso } from '@/lib/manso-ficha';

/**
 * /llms.txt — el resumen del sitio para asistentes de IA (ChatGPT, Claude,
 * Perplexity). Formato de llmstxt.org: markdown con lo esencial y links.
 *
 * El texto lo arma `fichaManso` (lo comparte con el chat del festival).
 */
export const revalidate = 3600;

export async function GET() {
  return new Response(await fichaManso(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
