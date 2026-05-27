import { createSupabaseServer } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { AdaptiveSectionLayout } from '@/components/ui/AdaptiveSectionLayout';
import { ParticleBackground } from '@/components/Home/ParticleBackground';
import LogoutButton from './LogoutButton';

export default async function MiCuentaPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('display_name, email')
    .eq('id', user.id)
    .single();

  const { data: membresia } = await supabase
    .from('user_membresias_activas')
    .select('vencimiento, estado, membresia_id, membresias(nombre)')
    .eq('user_id', user.id)
    .eq('estado', 'activa')
    .gt('vencimiento', new Date().toISOString())
    .maybeSingle();

  const displayName = profile?.display_name || profile?.email || 'Usuario';

  return (
    <div className="relative min-h-screen bg-manso-black">
      <ParticleBackground />
      <AdaptiveSectionLayout
        title="Mi Cuenta"
        subtitle={`Bienvenido, ${displayName}_`}
        customBg="bg-transparent"
      >
        <div className="space-y-6 max-w-lg">
          {/* Membresía activa */}
          <div className="rounded-[30px] border border-manso-cream/10 p-8 bg-manso-cream/5">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-manso-terra mb-3">
              Membresía
            </p>
            {membresia ? (
              <>
                <p className="text-manso-cream font-black text-xl uppercase tracking-tight">
                  {(membresia.membresias as { nombre: string } | null)?.nombre ?? 'Activa'}
                </p>
                <p className="text-manso-cream/40 text-xs mt-1 uppercase tracking-widest">
                  Vence: {new Date(membresia.vencimiento).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </>
            ) : (
              <p className="text-manso-cream/40 text-sm">
                No tenés una membresía activa.{' '}
                <a href="/membresias" className="text-manso-terra hover:text-manso-cream transition-colors underline">
                  Ver planes
                </a>
              </p>
            )}
          </div>

          {/* Datos de cuenta */}
          <div className="rounded-[30px] border border-manso-cream/10 p-8 bg-manso-cream/5">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-manso-terra mb-3">
              Cuenta
            </p>
            <p className="text-manso-cream font-bold text-sm">{profile?.email}</p>
          </div>

          <LogoutButton />
        </div>
      </AdaptiveSectionLayout>
    </div>
  );
}
