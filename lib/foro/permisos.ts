import type { createSupabaseServer } from '@/lib/supabase'

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServer>>

export type ForoPermisos = {
  puedeEscribir: boolean
  puedeComentar: boolean
  estaBaneado: boolean
}

export async function getForoPermisos(supabase: SupabaseServerClient, userId: string): Promise<ForoPermisos> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('permisos_totales, foro_baneado')
    .eq('id', userId)
    .single()

  const estaBaneado = profile?.foro_baneado ?? false
  return {
    puedeEscribir: (profile?.permisos_totales ?? false) && !estaBaneado,
    puedeComentar: !estaBaneado,
    estaBaneado,
  }
}
