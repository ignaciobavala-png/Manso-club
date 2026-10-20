import { createSupabaseAnon } from '@/lib/supabase';
import type { Membresia } from '@/lib/types/membresia';
import { MembresiasClient, type ProximaFechaCowork } from './MembresiasClient';

// Las membresías cambian poco y las carga Ana desde el panel: 30 s alcanza para
// que el HTML llegue completo (con planes y precios) sin pegarle a Supabase en
// cada visita.
export const revalidate = 30;

async function proximaFechaCowork(
  supabase: ReturnType<typeof createSupabaseAnon>,
): Promise<ProximaFechaCowork | null> {
  const hoy = new Date().toISOString().slice(0, 10);
  const [{ data: fechas }, { data: cupos }] = await Promise.all([
    supabase
      .from('cowork_fechas')
      .select('id, fecha, horario, cupos_maximos')
      .eq('activo', true)
      .gte('fecha', hoy)
      .order('fecha', { ascending: true })
      .limit(1),
    supabase.rpc('cowork_cupos'),
  ]);

  const proxima = fechas?.[0];
  if (!proxima) return null;

  const ocupados = Number(
    (cupos ?? []).find((c: { fecha_id: string; ocupados: number | string }) => c.fecha_id === proxima.id)
      ?.ocupados ?? 0,
  );

  return {
    fecha: proxima.fecha,
    horario: proxima.horario,
    restantes: Math.max(0, proxima.cupos_maximos - ocupados),
  };
}

export default async function MembresiasPage() {
  const supabase = createSupabaseAnon();

  const [membresiasRes, introRes, galeriaRes, proximaFecha] = await Promise.all([
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
    proximaFechaCowork(supabase).catch(() => null),
  ]);

  return (
    <MembresiasClient
      membresias={(membresiasRes.data ?? []) as Membresia[]}
      galeria={(galeriaRes.data ?? []).map(img => ({ id: img.id, src: img.photo_url }))}
      textoIntro={introRes.data?.texto_intro ?? ''}
      proximaFecha={proximaFecha}
    />
  );
}
