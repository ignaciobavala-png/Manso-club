import { createSupabaseAnon } from '@/lib/supabase';
import type { Membresia } from '@/lib/types/membresia';
import { fotosCultural } from '@/lib/cultura-fotos';
import { MembresiasClient } from './MembresiasClient';

// Las membresías cambian poco y las carga Ana desde el panel: 30 s alcanza para
// que el HTML llegue completo (con planes y precios) sin pegarle a Supabase en
// cada visita.
export const revalidate = 30;

export default async function MembresiasPage() {
  const supabase = createSupabaseAnon();

  const [membresiasRes, introRes, galeriaRes, culturaBanners, culturaBloques] = await Promise.all([
    supabase
      .from('membresias')
      .select('*, membresia_beneficios (id, texto, incluido)')
      .eq('activo', true)
      .order('orden', { ascending: true }),
    supabase.from('membresias_config').select('texto_intro').single(),
    supabase
      .from('membresias_gallery')
      .select('id, photo_url')
      .eq('active', true)
      .order('order_index', { ascending: true }),
    // Fotos de la card Cultural Manso: las mismas de su página, sin carga aparte.
    supabase.from('cultura_banners').select('imagen_url').eq('activo', true).order('orden', { ascending: true }),
    supabase
      .from('cultura_bloques')
      .select('foto_izquierda_url, foto_derecha_url')
      .eq('activo', true)
      .order('orden', { ascending: true }),
  ]);

  const fotos = fotosCultural(culturaBanners.data, culturaBloques.data);

  return (
    <MembresiasClient
      membresias={(membresiasRes.data ?? []) as Membresia[]}
      galeria={(galeriaRes.data ?? []).map(img => ({ id: img.id, src: img.photo_url }))}
      textoIntro={introRes.data?.texto_intro ?? ''}
      fotosCultural={fotos}
    />
  );
}
