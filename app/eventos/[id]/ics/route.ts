import { createSupabaseAnon } from '@/lib/supabase';
import { respuestaIcs } from '@/lib/calendario';

export const revalidate = 60;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response('No encontrado', { status: 404 });

  const { data: evento } = await createSupabaseAnon()
    .from('eventos')
    .select('id, titulo, descripcion, fecha')
    .eq('id', id)
    .eq('activo', true)
    .maybeSingle();
  if (!evento?.fecha) return new Response('No encontrado', { status: 404 });

  return respuestaIcs(
    { titulo: evento.titulo, descripcion: evento.descripcion, inicio: new Date(evento.fecha), path: `/eventos/${evento.id}` },
    `evento-${evento.id}`,
    'manso-club-evento',
  );
}
