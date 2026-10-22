'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ChatConversacion, ChatMensaje, ChatSala } from '@/lib/types/chat'

const LEIDO_KEY = (userId: string) => `mansochat:leido:${userId}`

function leerLeidos(userId: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LEIDO_KEY(userId)) ?? '{}')
  } catch {
    return {}
  }
}

function guardarLeidos(userId: string, v: Record<string, string>) {
  try {
    localStorage.setItem(LEIDO_KEY(userId), JSON.stringify(v))
  } catch {
    /* sin storage: los no leídos se reinician al recargar, no pasa nada */
  }
}

/**
 * La bandeja de entrada del chat: todas las salas que veo, su último mensaje,
 * cuántos no leí y quién está en línea. Una sola suscripción de Realtime para
 * todas las salas (la RLS ya filtra las ajenas) en vez de una por sala.
 */
export function useChatInbox(userId: string, userNombre: string) {
  const [conversaciones, setConversaciones] = useState<ChatConversacion[]>([])
  const [noLeidos, setNoLeidos] = useState<Record<string, number>>({})
  const [enLinea, setEnLinea] = useState<Set<string>>(new Set())
  const [retencionGlobal, setRetencionGlobal] = useState(30)
  const [cargando, setCargando] = useState(true)

  const activaRef = useRef<string | null>(null)
  const conversacionesRef = useRef<ChatConversacion[]>([])

  const cargar = useCallback(async () => {
    const [{ data: salas }, { data: miembros }, { data: resumen }, { data: config }] = await Promise.all([
      supabase.from('chat_salas').select('id, tipo, nombre, descripcion, retencion_dias, creada_por').order('created_at'),
      supabase.from('chat_miembros').select('sala_id, user_id').neq('user_id', userId),
      supabase.rpc('chat_resumen'),
      supabase.from('chat_config').select('retencion_dias').maybeSingle(),
    ])

    const salasOk = (salas ?? []) as ChatSala[]
    const otroDeSala = new Map(
      (miembros ?? [])
        .filter(m => salasOk.find(s => s.id === m.sala_id)?.tipo === 'dm')
        .map(m => [m.sala_id as string, m.user_id as string]),
    )
    const idsOtros = [...new Set(otroDeSala.values())]
    const { data: perfiles } = idsOtros.length
      ? await supabase.from('user_profiles_publico').select('id, display_name, avatar_url').in('id', idsOtros)
      : { data: [] }
    const porId = new Map((perfiles ?? []).map(p => [p.id as string, p]))
    const ultimoDe = new Map(
      ((resumen ?? []) as { sala_id: string; cuerpo: string; autor_nombre: string | null; created_at: string }[]).map(
        r => [r.sala_id, { cuerpo: r.cuerpo, autor_nombre: r.autor_nombre, created_at: r.created_at }],
      ),
    )

    const lista: ChatConversacion[] = salasOk.map(sala => {
      const otroId = otroDeSala.get(sala.id)
      const p = otroId ? porId.get(otroId) : null
      return {
        sala,
        otro: otroId ? { id: otroId, nombre: p?.display_name ?? 'Usuario', avatar: p?.avatar_url ?? null } : null,
        ultimo: ultimoDe.get(sala.id) ?? null,
      }
    })
    lista.sort((a, b) => {
      if (a.sala.tipo === 'general') return -1
      if (b.sala.tipo === 'general') return 1
      return (b.ultimo?.created_at ?? '').localeCompare(a.ultimo?.created_at ?? '')
    })

    // Sin registro de lectura, lo último de otra persona cuenta como 1 sin leer
    const leidos = leerLeidos(userId)
    setNoLeidos(prev => {
      const sig = { ...prev }
      for (const c of lista) {
        if (sig[c.sala.id] !== undefined) continue
        const u = c.ultimo
        const nuevo = u && c.sala.id !== activaRef.current && u.created_at > (leidos[c.sala.id] ?? '')
        sig[c.sala.id] = nuevo && u.autor_nombre !== userNombre ? 1 : 0
      }
      return sig
    })

    conversacionesRef.current = lista
    setConversaciones(lista)
    if (config?.retencion_dias) setRetencionGlobal(config.retencion_dias as number)
    setCargando(false)
  }, [userId, userNombre])

  useEffect(() => {
    void cargar()

    const canal = supabase.channel('mansochat:global', { config: { presence: { key: userId } } })
    canal
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_mensajes' }, payload => {
        const m = payload.new as ChatMensaje
        const conocida = conversacionesRef.current.some(c => c.sala.id === m.sala_id)
        if (!conocida) {
          // un DM nuevo, o una sala a la que me sumaron
          void cargar()
        } else {
          setConversaciones(prev => {
            const sig = prev.map(c =>
              c.sala.id === m.sala_id
                ? { ...c, ultimo: { cuerpo: m.cuerpo, autor_nombre: m.autor_nombre, created_at: m.created_at } }
                : c,
            )
            conversacionesRef.current = sig
            return sig
          })
        }
        const leyendo = activaRef.current === m.sala_id && !document.hidden
        if (m.autor_id !== userId && !leyendo) {
          setNoLeidos(prev => ({ ...prev, [m.sala_id]: (prev[m.sala_id] ?? 0) + 1 }))
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_salas' }, () => void cargar())
      .on('presence', { event: 'sync' }, () => setEnLinea(new Set(Object.keys(canal.presenceState()))))
      .subscribe(async estado => {
        if (estado === 'SUBSCRIBED') await canal.track({ nombre: userNombre })
      })

    return () => {
      supabase.removeChannel(canal)
    }
  }, [cargar, userId, userNombre])

  const marcarLeida = useCallback(
    (salaId: string) => {
      const leidos = leerLeidos(userId)
      leidos[salaId] = new Date().toISOString()
      guardarLeidos(userId, leidos)
      setNoLeidos(prev => (prev[salaId] ? { ...prev, [salaId]: 0 } : prev))
    },
    [userId],
  )

  /** La sala que se está viendo: sus mensajes nuevos no suman como no leídos. */
  const setActiva = useCallback(
    (salaId: string | null) => {
      activaRef.current = salaId
      if (salaId) marcarLeida(salaId)
    },
    [marcarLeida],
  )

  return { conversaciones, noLeidos, enLinea, retencionGlobal, cargando, recargar: cargar, setActiva, marcarLeida }
}
