import { createSupabaseAnon } from '@/lib/supabase';
import { inicioDesdeFechaYHora, respuestaIcs } from '@/lib/calendario';

export const revalidate = 60;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Sólo lo público, igual que la og: lo demás da 404 a quien no tiene acceso.
  const { data: item } = await createSupabaseAnon()
    .from('agenda')
    .select('id, titulo, descripcion, slug, fecha_inicio, horario')
    .eq('slug', slug)
    .eq('activo', true)
    .eq('visibilidad', 'publico')
    .maybeSingle();
  if (!item?.fecha_inicio) return new Response('No encontrado', { status: 404 });

  return respuestaIcs(
    {
      titulo: item.titulo,
      descripcion: item.descripcion,
      inicio: inicioDesdeFechaYHora(item.fecha_inicio, item.horario),
      todoElDia: !item.horario,
      path: `/agenda/${item.slug}`,
    },
    `agenda-${item.id}`,
    `manso-club-${item.slug}`,
  );
}
