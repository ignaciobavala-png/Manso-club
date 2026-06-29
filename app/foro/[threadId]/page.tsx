import { notFound } from 'next/navigation'
import { createSupabaseAnon, createSupabaseServer } from '@/lib/supabase'
import { ParticleBackground } from '@/components/Home/ParticleBackground'
import ThreadView from '@/components/Foro/ThreadView'

export const dynamic = 'force-dynamic'

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>
}) {
  const { threadId } = await params
  const supabase = createSupabaseAnon()

  const [{ data: thread }, { data: replies }] = await Promise.all([
    supabase
      .from('foro_threads')
      .select('id, titulo, cuerpo, categoria_id, autor_id, autor_nombre, autor_avatar, pinned, cerrado, views, reply_count, created_at, updated_at')
      .eq('id', threadId)
      .single(),
    supabase
      .from('foro_replies')
      .select('id, thread_id, cuerpo, autor_id, autor_nombre, autor_avatar, created_at, updated_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true }),
  ])

  if (!thread) notFound()

  // Incrementar views (fire and forget)
  supabase.rpc('increment_thread_views', { p_thread_id: threadId })

  // Reacciones del thread + todas sus replies en una sola query
  const replyIds = (replies ?? []).map(r => r.id)
  const reaccionesFilter = replyIds.length > 0
    ? `thread_id.eq.${threadId},reply_id.in.(${replyIds.join(',')})`
    : `thread_id.eq.${threadId}`
  const { data: reacciones } = await supabase
    .from('foro_reacciones')
    .select('emoji, autor_id, thread_id, reply_id')
    .or(reaccionesFilter)

  // Categoría
  let categoria = null
  if (thread.categoria_id) {
    const { data } = await supabase
      .from('foro_categorias')
      .select('nombre, slug')
      .eq('id', thread.categoria_id)
      .single()
    categoria = data
  }

  // Permisos del usuario actual
  const supabaseAuth = await createSupabaseServer()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  let puedeEscribir = false
  if (user) {
    const { data: profile } = await supabaseAuth
      .from('user_profiles')
      .select('permisos_totales')
      .eq('id', user.id)
      .single()
    puedeEscribir = profile?.permisos_totales ?? false
  }

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
      <div className="relative z-10 max-w-[800px] mx-auto px-4 md:px-8 pt-32 pb-20">
        <ThreadView
          thread={{ ...thread, categoria }}
          replies={replies ?? []}
          reacciones={reacciones ?? []}
          currentUserId={user?.id ?? null}
          puedeEscribir={puedeEscribir}
          estaLogueado={!!user}
        />
      </div>
    </div>
  )
}
