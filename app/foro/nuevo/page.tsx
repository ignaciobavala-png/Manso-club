import { redirect } from 'next/navigation'
import { createSupabaseServer, createSupabaseAnon } from '@/lib/supabase'
import { getForoPermisos } from '@/lib/foro/permisos'
import { ParticleBackground } from '@/components/Home/ParticleBackground'
import NewThreadForm from '@/components/Foro/NewThreadForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Nuevo Post | Comunidad Manso',
}

export default async function NuevoThreadPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?from=/foro/nuevo')

  const { puedeEscribir, estaBaneado } = await getForoPermisos(supabase, user.id)

  if (estaBaneado) {
    return (
      <div className="relative min-h-screen bg-manso-black flex items-center justify-center px-4">
        <ParticleBackground />
        <div className="relative z-10 text-center max-w-md">
          <p className="text-manso-terra text-xs tracking-[0.2em] uppercase mb-4">Comunidad Manso</p>
          <h1 className="text-manso-cream text-2xl font-bold mb-4">Acceso restringido</h1>
          <p className="text-manso-cream/50 text-sm">
            Tu cuenta fue restringida para participar en el foro.
            Contactá a Ana si creés que es un error.
          </p>
        </div>
      </div>
    )
  }

  if (!puedeEscribir) {
    return (
      <div className="relative min-h-screen bg-manso-black flex items-center justify-center px-4">
        <ParticleBackground />
        <div className="relative z-10 text-center max-w-md">
          <p className="text-manso-terra text-xs tracking-[0.2em] uppercase mb-4">Comunidad Manso</p>
          <h1 className="text-manso-cream text-2xl font-bold mb-4">Acceso restringido</h1>
          <p className="text-manso-cream/50 text-sm">
            Tu cuenta aún no tiene acceso para participar en el foro.
            Contactá a Ana para solicitar permisos.
          </p>
        </div>
      </div>
    )
  }

  const { data: categorias } = await createSupabaseAnon()
    .from('foro_categorias')
    .select('id, nombre, slug')
    .eq('activo', true)
    .order('orden')

  return (
    <div
      className="relative min-h-screen bg-manso-black"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    >
      <ParticleBackground />
      <div className="relative z-10 max-w-[700px] mx-auto px-4 md:px-8 pt-32 pb-20">
        <div className="mb-8">
          <p className="text-manso-terra text-xs tracking-[0.2em] uppercase mb-2">Comunidad Manso</p>
          <h1 className="text-manso-cream font-bold text-3xl tracking-tight">Nuevo Post_</h1>
        </div>
        <NewThreadForm categorias={categorias ?? []} />
      </div>
    </div>
  )
}
