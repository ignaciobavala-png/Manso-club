import { createSupabaseAnon } from '@/lib/supabase';
import type { Membresia } from '@/lib/types/membresia';
import { fotosCultural } from '@/lib/cultura-fotos';
import { MembresiasClient, type ProximaFechaCowork } from './MembresiasClient';

// Las membresías cambian poco y las carga Ana desde el panel: 30 s alcanza para
// que el HTML llegue completo (con planes y precios) sin pegarle a Supabase en
// cada visita.
export const revalidate = 30;

async function proximasFechasCowork(
  supabase: ReturnType<typeof createSupabaseAnon>,
): Promise<ProximaFechaCowork[]> {
  const hoy = new Date().toISOString().slice(0, 10);
  const [{ data: fechas }, { data: cupos }] = await Promise.all([
    supabase
      .from('cowork_fechas')
      .select('id, fecha, horario, cupos_maximos')
      .eq('activo', true)
      .gte('fecha', hoy)
      .order('fecha', { ascending: true })
      .limit(3),
    supabase.rpc('cowork_cupos'),
  ]);

  return (fechas ?? []).map((f) => {
    const ocupados = Number(
      (cupos ?? []).find((c: { fecha_id: string; ocupados: number | string }) => c.fecha_id === f.id)
        ?.ocupados ?? 0,
    );
    return {
      fecha: f.fecha,
      horario: f.horario,
      restantes: Math.max(0, f.cupos_maximos - ocupados),
      total: f.cupos_maximos,
    };
  });
}

export default async function MembresiasPage() {
  const supabase = createSupabaseAnon();

  const [membresiasRes, introRes, galeriaRes, proximasFechas, culturaBanners, culturaBloques] = await Promise.all([
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
    proximasFechasCowork(supabase).catch(() => []),
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
      proximasFechas={proximasFechas}
      fotosCultural={fotos}
    />
  );
}
