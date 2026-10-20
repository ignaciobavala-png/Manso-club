import { createSupabaseAnon } from '@/lib/supabase';
import { fechaParaOg, tarjetaOgEvento } from '@/lib/og-evento';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await createSupabaseAnon()
    .from('eventos')
    .select('titulo, categoria, fecha, imagen_url')
    .eq('id', id)
    .eq('activo', true)
    .maybeSingle();

  return tarjetaOgEvento({
    titulo: data?.titulo ?? 'Manso Club',
    categoria: data?.categoria,
    linea: data?.fecha ? fechaParaOg(data.fecha) : null,
    imagenUrl: data?.imagen_url,
  });
}
