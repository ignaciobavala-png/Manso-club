import { SITE_URL } from '@/lib/constants';
import { descripcion } from '@/lib/seo';
import { leerEntradas, leerFaq, leerLineup, leerSpots } from '@/lib/festival';
import { fechaLarga, MARCA_SEO, tituloBusqueda } from '@/lib/festival-seo';
import { etiquetaEstado, type FestivalConfig } from '@/lib/types/festival';

const pesos = (n: number) => `$${n.toLocaleString('es-AR')} ARS`;

/**
 * La ficha pública del festival en markdown plano: fecha, lugar, entradas con
 * precio, line-up, spots y preguntas frecuentes. La comparten
 * `/blurfestival/llms.txt` (asistentes de IA de afuera) y el chat del sitio
 * (`lib/festival-bot.ts`), así los dos contestan lo mismo.
 *
 * Sale de las mismas lecturas que la web, así que respeta el RLS y las
 * perillas del panel: con el line-up apagado no lista artistas.
 */
export async function fichaFestival(config: FestivalConfig): Promise<string> {
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
    `- Sitio: ${SITE_URL}/blurfestival`,
  ].filter(Boolean);

  const artistas = lineup
    .flatMap((e) => e.artistas)
    .map((a) => `- [${a.nombre.trim()}](${SITE_URL}/blurfestival/line-up/${a.slug})${a.origen?.trim() ? `: ${a.origen.trim()}` : ''}${a.b2b ? ' (B2B con el anterior)' : ''}`);

  const tabla = entradas.map((e) => {
    const pack = e.entradas_por_unidad > 1 ? `, incluye ${e.entradas_por_unidad} entradas` : '';
    const texto = descripcion(e.descripcion, 160);
    return `- ${e.nombre.trim()}: ${pesos(e.precio)}${pack} (${etiquetaEstado(e.estado)}).${texto ? ` ${texto}` : ''}`;
  });

  const preguntas = faq.map((p) => `### ${p.titulo.trim()}\n\n${p.texto.trim()}`);
  const lugares = spots.map((s) => `- ${s.titulo.trim()}${descripcion(s.descripcion, 160) ? `: ${descripcion(s.descripcion, 160)}` : ''}`);

  return `# ${tituloBusqueda(config)}

> ${MARCA_SEO} Festival es un festival de música electrónica de Manso Club${cuando ? `, el ${cuando}` : ''}${config.lugar ? ` en ${config.lugar}` : ''}, Buenos Aires, Argentina.${config.lema ? ` ${config.lema.trim()}.` : ''}

${datos.join('\n')}

## Entradas

${tabla.length ? tabla.join('\n') : '- Se anuncian pronto.'}

Se compran online en ${SITE_URL}/blurfestival/tickets (Mercado Pago, transferencia o cripto, según lo que esté habilitado). Cada persona recibe su QR por mail.
${config.aviso?.trim() ? `\nAviso: ${config.aviso.trim()}\n` : ''}
## Line-up

${artistas.length ? artistas.join('\n') : '- Se anuncia pronto.'}
${lugares.length ? `\n## Spots\n\n${lugares.join('\n')}\n` : ''}
## Páginas

- [Inicio](${SITE_URL}/blurfestival)
- [Visión](${SITE_URL}/blurfestival/vision)
- [Locación](${SITE_URL}/blurfestival/locacion)
- [Tickets](${SITE_URL}/blurfestival/tickets)
- [Info y preguntas frecuentes](${SITE_URL}/blurfestival/info)
${preguntas.length ? `\n## Preguntas frecuentes\n\n${preguntas.join('\n\n')}\n` : ''}
## Más

- [Manso Club](${SITE_URL}/llms.txt): el club que organiza el festival.
`;
}
