import { SITE_URL } from '@/lib/constants';
import { descripcion } from '@/lib/seo';
import { leerConfig, leerEntradas, leerFaq, leerLineup, leerSpots } from '@/lib/festival';
import { fechaLarga, MARCA_SEO, tituloBusqueda } from '@/lib/festival-seo';
import { etiquetaEstado } from '@/lib/types/festival';

/**
 * /blur/llms.txt — la ficha del festival para asistentes de IA (ChatGPT,
 * Claude, Perplexity, Gemini). Es el detalle de lo que /llms.txt resume en una
 * línea: fecha, lugar, line-up, entradas con precio y preguntas frecuentes, en
 * markdown plano para que un agente conteste "¿cuándo es BLUR?" o "¿cuánto
 * sale la entrada?" sin parsear el HTML.
 *
 * Sale de las mismas lecturas que la web, así que respeta el RLS: sin
 * publicar, la config vuelve vacía y esto responde 404. Con el line-up
 * apagado, no lista artistas.
 */
export const dynamic = 'force-dynamic';

const pesos = (n: number) => `$${n.toLocaleString('es-AR')} ARS`;

export async function GET() {
  const config = await leerConfig();
  if (!config?.publicado) return new Response('No encontrado', { status: 404 });

  const [lineup, entradas, faq, spots] = await Promise.all([leerLineup(), leerEntradas(), leerFaq(), leerSpots()]);

  const cuando = fechaLarga(config.fecha);
  const donde = [config.lugar, config.direccion].filter(Boolean).join(', ');

  const datos = [
    cuando && `- Fecha: ${cuando}`,
    config.horario && `- Horario: ${config.horario}`,
    donde && `- Lugar: ${donde}`,
    '- Organiza: Manso Club (Buenos Aires, Argentina)',
    config.instagram && `- Instagram: https://www.instagram.com/${config.instagram}/`,
    config.email && `- Contacto: ${config.email}`,
    `- Sitio: ${SITE_URL}/blur`,
  ].filter(Boolean);

  const artistas = lineup
    .flatMap((e) => e.artistas)
    .map((a) => `- [${a.nombre.trim()}](${SITE_URL}/blur/line-up/${a.slug})${a.origen?.trim() ? `: ${a.origen.trim()}` : ''}${a.b2b ? ' (B2B con el anterior)' : ''}`);

  const tabla = entradas.map((e) => {
    const pack = e.entradas_por_unidad > 1 ? `, incluye ${e.entradas_por_unidad} entradas` : '';
    const texto = descripcion(e.descripcion, 160);
    return `- ${e.nombre.trim()}: ${pesos(e.precio)}${pack} (${etiquetaEstado(e.estado)}).${texto ? ` ${texto}` : ''}`;
  });

  const preguntas = faq.map((p) => `### ${p.titulo.trim()}\n\n${p.texto.trim()}`);
  const lugares = spots.map((s) => `- ${s.titulo.trim()}${descripcion(s.descripcion, 160) ? `: ${descripcion(s.descripcion, 160)}` : ''}`);

  const cuerpo = `# ${tituloBusqueda(config)}

> ${MARCA_SEO} Festival es un festival de música electrónica de Manso Club${cuando ? `, el ${cuando}` : ''}${config.lugar ? ` en ${config.lugar}` : ''}, Buenos Aires, Argentina.${config.lema ? ` ${config.lema.trim()}.` : ''}

${datos.join('\n')}

## Entradas

${tabla.length ? tabla.join('\n') : '- Se anuncian pronto.'}

Se compran online en ${SITE_URL}/blur/tickets (Mercado Pago, transferencia o cripto, según lo que esté habilitado). Cada persona recibe su QR por mail.
${config.aviso?.trim() ? `\nAviso: ${config.aviso.trim()}\n` : ''}
## Line-up

${artistas.length ? artistas.join('\n') : '- Se anuncia pronto.'}
${lugares.length ? `\n## Spots\n\n${lugares.join('\n')}\n` : ''}
## Páginas

- [Inicio](${SITE_URL}/blur)
- [Visión](${SITE_URL}/blur/vision)
- [Locación](${SITE_URL}/blur/locacion)
- [Tickets](${SITE_URL}/blur/tickets)
- [Info y preguntas frecuentes](${SITE_URL}/blur/info)
${preguntas.length ? `\n## Preguntas frecuentes\n\n${preguntas.join('\n\n')}\n` : ''}
## Más

- [Manso Club](${SITE_URL}/llms.txt): el club que organiza el festival.
`;

  return new Response(cuerpo, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
    },
  });
}
