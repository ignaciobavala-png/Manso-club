'use server'

import { createSupabaseServer } from '@/lib/supabase'
import { getForoPermisos } from '@/lib/foro/permisos'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function getPermisos() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, puedeEscribir: false, puedeComentar: false, estaBaneado: false, supabase }
  const { puedeEscribir, puedeComentar, estaBaneado } = await getForoPermisos(supabase, user.id)
  return { user, puedeEscribir, puedeComentar, estaBaneado, supabase }
}

export async function crearThread(formData: FormData) {
  const { user, puedeEscribir, estaBaneado, supabase } = await getPermisos()
  if (!user) redirect('/login?from=/foro/nuevo')
  if (estaBaneado) throw new Error('Tu cuenta fue restringida para participar en el foro')
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
  const { user, puedeComentar, estaBaneado, supabase } = await getPermisos()
  if (!user) redirect(`/login?from=/foro/${threadId}`)
  if (estaBaneado) throw new Error('Tu cuenta fue restringida para participar en el foro')
  if (!puedeComentar) throw new Error('Sin permisos para responder')

  const cuerpo = (formData.get('cuerpo') as string).trim()
  if (!cuerpo) throw new Error('El mensaje no puede estar vacío')

  const { error } = await supabase
    .from('foro_replies')
    .insert({ thread_id: threadId, cuerpo, autor_id: user.id })

  if (error) throw new Error(error.message)

  revalidatePath(`/foro/${threadId}`)
}

export async function reportarContenido({
  threadId,
  replyId,
  motivo,
}: {
  threadId?: string
  replyId?: string
  motivo: string
}) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Debés iniciar sesión para denunciar contenido')

  const motivoLimpio = motivo.trim()
  if (!motivoLimpio) throw new Error('Contanos brevemente el motivo de la denuncia')

  const { error } = await supabase.from('foro_reportes').insert({
    thread_id: threadId ?? null,
    reply_id: replyId ?? null,
    reportado_por: user.id,
    motivo: motivoLimpio,
  })

  if (error) throw new Error(error.message)
}
