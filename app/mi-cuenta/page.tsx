import { createSupabaseServer } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { ParticleBackground } from '@/components/Home/ParticleBackground';
import MiCuentaTabs from './MiCuentaTabs';

export const metadata = { title: 'Mi Cuenta | Manso Club' };

export default async function MiCuentaPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch en paralelo
  const [
    { data: profile },
    { data: membresiaRaw },
    { data: streamingRaw },
    { data: ticketsRaw },
  ] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('display_name, email, telefono, avatar_url, id')
      .eq('id', user.id)
      .single(),

    supabase
      .from('user_membresias_activas')
      .select('vencimiento, membresias(nombre, precio, periodo, incluye_streaming, membresia_beneficios(texto, incluido, orden))')
      .eq('user_id', user.id)
      .eq('estado', 'activa')
      .gt('vencimiento', new Date().toISOString())
      .order('vencimiento', { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from('streaming_contenido')
      .select('id, titulo, slug, tipo, thumbnail_url')
      .eq('activo', true)
      .order('orden', { ascending: true })
      .limit(3),

    supabase
      .from('tickets')
      .select('id, codigo, evento_nombre, tipo, usado, created_at')
      .eq('email', user.email!)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const membresiaData = membresiaRaw?.membresias as {
    nombre: string;
    precio: number;
    periodo: string;
    incluye_streaming: boolean;
    membresia_beneficios: { texto: string; incluido: boolean; orden: number }[];
  } | null | undefined;

  const membresia = membresiaData
    ? {
        nombre: membresiaData.nombre,
        precio: membresiaData.precio,
        periodo: membresiaData.periodo,
        incluye_streaming: membresiaData.incluye_streaming,
        vencimiento: membresiaRaw!.vencimiento,
        beneficios: [...(membresiaData.membresia_beneficios ?? [])]
          .sort((a, b) => a.orden - b.orden)
          .map(b => ({ texto: b.texto, incluido: b.incluido })),
      }
    : null;

  const tieneMembresia = !!membresia?.incluye_streaming;
  const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'Usuario';

  return (
    <div className="relative min-h-screen bg-manso-black">
      <ParticleBackground />
      <div className="relative z-10">
        <MiCuentaTabs
          userId={user.id}
          displayName={displayName}
          email={profile?.email ?? user.email ?? ''}
          telefono={profile?.telefono ?? null}
          avatarUrl={profile?.avatar_url ?? null}
          membresia={membresia}
          streaming={streamingRaw ?? []}
          tickets={ticketsRaw ?? []}
          tieneMembresia={tieneMembresia}
        />
      </div>
    </div>
  );
}
