import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase'
import ChatApp from '@/components/Chat/ChatApp'

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
  const { dm, sala } = await searchParams
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // /mansochat?dm=<user_id> abre (o crea) el mensaje directo y vuelve con la sala elegida
  if (dm && UUID.test(dm) && dm !== user.id) {
    const { data: salaId } = await supabase.rpc('chat_abrir_dm', { p_otro: dm })
    if (salaId) redirect(`/mansochat?sala=${salaId}`)
  }

  const [{ data: perfil }, { data: esAdmin }] = await Promise.all([
    supabase.from('user_profiles').select('display_name, chat_baneado').eq('id', user.id).single(),
    supabase.rpc('is_admin'),
  ])

  return (
    <ChatApp
      userId={user.id}
      userNombre={perfil?.display_name ?? 'Usuario'}
      baneado={perfil?.chat_baneado ?? false}
      esAdmin={esAdmin === true}
      salaInicial={sala && UUID.test(sala) ? sala : null}
    />
  )
}
