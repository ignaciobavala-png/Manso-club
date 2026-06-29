'use server'

import { createSupabaseServer } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function getPermisos() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, puedeEscribir: false, supabase }
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('permisos_totales')
    .eq('id', user.id)
    .single()
  return { user, puedeEscribir: profile?.permisos_totales ?? false, supabase }
}

export async function crearThread(formData: FormData) {
  const { user, puedeEscribir, supabase } = await getPermisos()
  if (!user) redirect('/login?from=/foro/nuevo')
  if (!puedeEscribir) throw new Error('Sin permisos para escribir en el foro')

  const titulo = (formData.get('titulo') as string).trim()
  const cuerpo = (formData.get('cuerpo') as string).trim()
  const categoria_id = (formData.get('categoria_id') as string) || null

  if (!titulo || !cuerpo) throw new Error('Título y cuerpo son requeridos')

  const { data, error } = await supabase
    .from('foro_threads')
    .insert({ titulo, cuerpo, categoria_id, autor_id: user.id })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/foro')
  redirect(`/foro/${data.id}`)
}

export async function crearReply(threadId: string, formData: FormData) {
  const { user, puedeEscribir, supabase } = await getPermisos()
  if (!user) redirect(`/login?from=/foro/${threadId}`)
  if (!puedeEscribir) throw new Error('Sin permisos para responder')

  const cuerpo = (formData.get('cuerpo') as string).trim()
  if (!cuerpo) throw new Error('El mensaje no puede estar vacío')

  const { error } = await supabase
    .from('foro_replies')
    .insert({ thread_id: threadId, cuerpo, autor_id: user.id })

  if (error) throw new Error(error.message)

  revalidatePath(`/foro/${threadId}`)
}
