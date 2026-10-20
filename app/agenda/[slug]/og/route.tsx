import { createSupabaseAnon } from '@/lib/supabase';
import { tarjetaOgEvento } from '@/lib/og-evento';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createSupabaseAnon();

  // Solo lo público: el rastreador de WhatsApp no tiene sesión y la imagen se
  // cachea, así que un taller para miembros no puede filtrarse por acá.
  const { data: taller } = await supabase
    .from('agenda')
    .select('id, titulo, categoria, frecuencia')
    .eq('slug', slug)
    .eq('activo', true)
    .eq('visibilidad', 'publico')
    .maybeSingle();

  const { data: fotos } = taller
    ? await supabase
        .from('agenda_fotos')
        .select('url')
        .eq('agenda_id', taller.id)
        .order('orden', { ascending: true })
        .limit(1)
    : { data: null };

  return tarjetaOgEvento({
    titulo: taller?.titulo ?? 'Manso Club',
    categoria: taller?.categoria,
    linea: taller?.frecuencia,
    imagenUrl: fotos?.[0]?.url,
  });
}
