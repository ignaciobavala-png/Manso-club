'use server'

import { createSupabaseServer } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

const EMOJIS_VALIDOS = ['heart', 'fire', 'clap']

export async function toggleReaccion({
  emoji,
  threadId,
  replyId,
  path,
}: {
  emoji: string
  threadId?: string
  replyId?: string
  path: string
}) {
  if (!EMOJIS_VALIDOS.includes(emoji)) throw new Error('Emoji inválido')

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  let query = supabase
    .from('foro_reacciones')
    .select('id')
    .eq('autor_id', user.id)
    .eq('emoji', emoji)

  if (threadId) query = query.eq('thread_id', threadId)
  if (replyId) query = query.eq('reply_id', replyId)

  const { data: existing } = await query.maybeSingle()

  if (existing) {
    await supabase.from('foro_reacciones').delete().eq('id', existing.id)
  } else {
    await supabase.from('foro_reacciones').insert({
      emoji,
      autor_id: user.id,
      thread_id: threadId ?? null,
      reply_id: replyId ?? null,
    })
  }

  revalidatePath(path)
}
