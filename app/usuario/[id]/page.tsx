import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseAnon } from '@/lib/supabase'
import { ParticleBackground } from '@/components/Home/ParticleBackground'
import { Globe } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function PerfilUsuarioPage({ params }: Props) {
  const { id } = await params
  const supabase = createSupabaseAnon()

  // Si el usuario ya tiene un perfil de artista, ese es su carta de
  // presentación "rica" — redirigimos ahí en vez de mostrar el genérico.
  const { data: artista } = await supabase
    .from('artistas')
    .select('slug')
    .eq('user_id', id)
    .eq('active', true)
    .maybeSingle()

  if (artista?.slug) {
    redirect(`/artistas/${artista.slug}`)
  }

  const { data: perfil } = await supabase
    .from('user_profiles_publico')
    .select('id, display_name, avatar_url, bio, social_links, created_at')
    .eq('id', id)
    .maybeSingle()

  if (!perfil) notFound()

  const nombre = perfil.display_name ?? 'Usuario'
  const inicial = (nombre.trim() || '?')[0].toUpperCase()
  const links: { label: string; url: string }[] = Array.isArray(perfil.social_links) ? perfil.social_links : []
  const miembroDesde = perfil.created_at
    ? new Date(perfil.created_at).toLocaleDateString('es-AR', { month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })
    : null

  return (
    <div className="relative min-h-screen bg-manso-black">
      <ParticleBackground />
      <div className="relative z-10 max-w-2xl mx-auto px-4 md:px-8 pt-32 pb-20">
        <div className="flex items-start gap-5 mb-8">
          <div className="shrink-0 w-20 h-20 rounded-full overflow-hidden ring-2 ring-manso-cream/15">
            {perfil.avatar_url ? (
              <img src={perfil.avatar_url} alt={nombre} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-manso-blue flex items-center justify-center text-manso-cream text-2xl font-bold">
                {inicial}
              </div>
            )}
          </div>
          <div className="pt-1">
            <h1 className="text-manso-cream font-bold text-2xl md:text-3xl leading-tight">{nombre}</h1>
            {miembroDesde && (
              <p className="text-manso-cream/30 text-xs mt-1 uppercase tracking-widest">Miembro desde {miembroDesde}</p>
            )}
          </div>
        </div>

        {perfil.bio ? (
          <p className="text-manso-cream/70 text-base leading-relaxed whitespace-pre-line mb-8">{perfil.bio}</p>
        ) : (
          <p className="text-manso-cream/30 text-sm italic mb-8">Este usuario todavía no completó su perfil.</p>
        )}

        {links.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-manso-cream/15 text-manso-cream/60 text-xs font-semibold hover:border-manso-terra/40 hover:text-manso-cream transition-colors"
              >
                <Globe size={12} />
                {link.label || link.url}
              </a>
            ))}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-manso-cream/10">
          <Link href="/foro" className="text-manso-cream/40 text-xs hover:text-manso-cream/70 transition-colors">
            ← Volver a Comunidad Manso
          </Link>
        </div>
      </div>
    </div>
  )
}
