import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase'
import ChatApp from '@/components/Chat/ChatApp'
import type { ChatConversacion, ChatSala } from '@/lib/types/chat'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Chat | Manso Club',
  robots: { index: false },
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ dm?: string; sala?: string }>
}) {
  const { dm, sala: salaParam } = await searchParams
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // /mansochat?dm=<user_id> abre (o crea) el mensaje directo y vuelve con la sala elegida
  if (dm && UUID.test(dm) && dm !== user.id) {
    const { data: salaId } = await supabase.rpc('chat_abrir_dm', { p_otro: dm })
    if (salaId) redirect(`/mansochat?sala=${salaId}`)
  }

  const [{ data: perfil }, { data: salas }, { data: miembros }] = await Promise.all([
    supabase.from('user_profiles').select('display_name, chat_baneado').eq('id', user.id).single(),
    supabase.from('chat_salas').select('id, tipo, nombre').order('created_at'),
    supabase.from('chat_miembros').select('sala_id, user_id').neq('user_id', user.id),
  ])

  const otroDeSala = new Map((miembros ?? []).map(m => [m.sala_id as string, m.user_id as string]))
  const idsOtros = [...new Set(otroDeSala.values())]
  const { data: perfiles } = idsOtros.length
    ? await supabase.from('user_profiles_publico').select('id, display_name, avatar_url').in('id', idsOtros)
    : { data: [] }
  const porId = new Map((perfiles ?? []).map(p => [p.id as string, p]))

  const conversaciones: ChatConversacion[] = ((salas ?? []) as ChatSala[]).map(sala => {
    const otroId = otroDeSala.get(sala.id)
    const p = otroId ? porId.get(otroId) : null
    return {
      sala,
      otro: otroId
        ? { id: otroId, nombre: p?.display_name ?? 'Usuario', avatar: p?.avatar_url ?? null }
        : null,
    }
  })
  // la general siempre primero
  conversaciones.sort((a, b) => Number(b.sala.tipo === 'general') - Number(a.sala.tipo === 'general'))

  const esAdmin = (await supabase.rpc('is_admin')).data === true

  return (
    <ChatApp
      userId={user.id}
      userNombre={perfil?.display_name ?? 'Usuario'}
      baneado={perfil?.chat_baneado ?? false}
      esAdmin={esAdmin}
      conversaciones={conversaciones}
      salaInicial={conversaciones.find(c => c.sala.id === salaParam)?.sala.id ?? conversaciones[0]?.sala.id ?? null}
    />
  )
}
