import { createSupabaseAnon } from '@/lib/supabase';
import { SITE_URL } from '@/lib/constants';
import { LUGAR, descripcion } from '@/lib/seo';

/**
 * /llms.txt — el resumen del sitio para asistentes de IA (ChatGPT, Claude,
 * Perplexity). Formato de llmstxt.org: markdown con lo esencial y links.
 *
 * Sale de la DB y no a mano porque lo que más preguntan (planes, precios,
 * qué hay en la agenda) cambia desde el panel. Solo entra lo público.
 */
export const revalidate = 3600;

/** Cierra con punto lo que se cargó sin puntuación final, para que no se pegue con lo que sigue. */
const frase = (t: string) => (/[.!?…]$/.test(t) ? t : `${t}.`);

export async function GET() {
  const supabase = createSupabaseAnon();
  const [{ data: membresias }, { data: agenda }, { data: artistas }] = await Promise.all([
    supabase
      .from('membresias')
      .select('nombre, slug, precio, periodo, descripcion_corta, descripcion, membresia_beneficios (texto, incluido)')
      .eq('activo', true)
      // Cultural Manso vive en la tabla pero no es un plan: va en "Más".
      .eq('es_cultural', false)
      .order('orden', { ascending: true }),
    supabase
      .from('agenda')
      .select('titulo, slug, descripcion, categoria, frecuencia, precio')
      .eq('activo', true)
      .eq('visibilidad', 'publico')
      .not('slug', 'is', null),
    supabase
      .from('artistas')
      .select('nombre, slug, estilo')
      .eq('active', true)
      .order('nombre', { ascending: true }),
  ]);

  const planes = (membresias ?? []).map((m) => {
    const precio = Number(m.precio) > 0 ? `USD ${m.precio} por ${m.periodo}` : 'sin costo';
    const incluye = (m.membresia_beneficios ?? [])
      .filter((b: { incluido: boolean; texto: string }) => b.incluido && b.texto?.trim())
      .map((b: { texto: string }) => b.texto.trim().replace(/\.+$/, ''))
      .join('; ');
    const texto = descripcion(m.descripcion_corta ?? m.descripcion, 200);
    const link = m.slug ? `[${m.nombre.trim()}](${SITE_URL}/membresias/${m.slug})` : m.nombre;
    return `- ${link}: ${precio}.${texto ? ` ${frase(texto)}` : ''}${incluye ? ` Incluye: ${incluye}.` : ''}`;
  });

  const actividades = (agenda ?? []).map((a) => {
    const precio = a.precio ? `$${a.precio.toLocaleString('es-AR')} ARS` : 'gratis';
    const detalle = [a.categoria, a.frecuencia, precio].filter(Boolean).join(', ');
    const texto = descripcion(a.descripcion, 200);
    return `- [${a.titulo.trim()}](${SITE_URL}/agenda/${a.slug}) (${detalle})${texto ? `: ${frase(texto)}` : ''}`;
  });

  const listaArtistas = (artistas ?? [])
    .map((a) => `[${a.nombre.trim()}](${SITE_URL}/artistas/${a.slug})${a.estilo?.trim() ? ` (${a.estilo.trim()})` : ''}`)
    .join(', ');

  const cuerpo = `# Manso Club

> Club creativo en ${LUGAR.barrio}, Buenos Aires (Argentina). Durante la semana funciona como cowork; los fines de semana es un espacio cultural con talleres, música, arte, pop-ups y encuentros. Un "tercer lugar" para artistas, creativos, freelancers y emprendedores.

- Dirección: ${LUGAR.calle}, ${LUGAR.codigoPostal}, ${LUGAR.barrio}, Ciudad Autónoma de Buenos Aires.
- WhatsApp: ${LUGAR.whatsapp}
- Instagram: ${LUGAR.instagram}
- Sitio: ${SITE_URL}

## Cómo sumarse al cowork

Las membresías no se pagan online: se completa una solicitud en ${SITE_URL}/membresias (botón SELECCIONAR de cada plan) y el equipo la aprueba y contacta a la persona. Para conocer el espacio antes hay un Open Cowork gratuito con cupo: ${SITE_URL}/membresias?form=open-cowork

## Planes de membresía

${planes.join('\n') || '- Consultar en ' + SITE_URL + '/membresias'}

## Agenda

${actividades.join('\n') || '- Ver ' + SITE_URL + '/agenda'}

Calendario mes a mes: ${SITE_URL}/calendario

## Artistas de la comunidad

${listaArtistas || 'Ver ' + SITE_URL + '/artistas'}

## Más

- [Sobre Manso](${SITE_URL}/about)
- [Nuestro espacio](${SITE_URL}/nuestro-espacio): las salas del cowork.
- [Cultural Manso](${SITE_URL}/mansocultural): ciclos, muestras y charlas.
- [Manifiesto](${SITE_URL}/manifiesto)
- [Tienda](${SITE_URL}/tienda)
- [Presentá tu proyecto](${SITE_URL}/presenta-tu-proyecto)
- [Trabajá con nosotros](${SITE_URL}/trabaja-con-nosotros)
`;

  return new Response(cuerpo, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
