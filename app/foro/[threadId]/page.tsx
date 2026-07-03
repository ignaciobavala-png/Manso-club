import { notFound } from 'next/navigation'
import { createSupabaseAnon, createSupabaseServer } from '@/lib/supabase'
import { getForoPermisos } from '@/lib/foro/permisos'
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

  // Permisos del usuario actual
  async function resolvePermisos() {
    const supabaseAuth = await createSupabaseServer()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return { user: null, puedeComentar: false, estaBaneado: false }
    const { puedeComentar, estaBaneado } = await getForoPermisos(supabaseAuth, user.id)
    return { user, puedeComentar, estaBaneado }
  }

  const [{ data: reacciones }, categoriaResult, { user, puedeComentar, estaBaneado }] = await Promise.all([
    supabase
      .from('foro_reacciones')
      .select('emoji, autor_id, thread_id, reply_id')
      .or(reaccionesFilter),
    thread.categoria_id
      ? supabase.from('foro_categorias').select('nombre, slug').eq('id', thread.categoria_id).single()
      : Promise.resolve({ data: null }),
    resolvePermisos(),
  ])

  const categoria = categoriaResult.data

  return (
    <div className="relative min-h-screen bg-manso-black">
      <ParticleBackground />
      <div className="relative z-10 max-w-[800px] mx-auto px-4 md:px-8 pt-32 pb-20">
        <ThreadView
          thread={{ ...thread, categoria }}
          replies={replies ?? []}
          reacciones={reacciones ?? []}
          currentUserId={user?.id ?? null}
          puedeComentar={puedeComentar}
          estaLogueado={!!user}
          estaBaneado={estaBaneado}
        />
      </div>
    </div>
  )
}
