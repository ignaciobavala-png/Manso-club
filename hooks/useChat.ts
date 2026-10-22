'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ChatMensaje } from '@/lib/types/chat'

const PAGINA = 50
const TYPING_MS = 3000

function unirPorId(a: ChatMensaje[], b: ChatMensaje[]) {
  const mapa = new Map<string, ChatMensaje>()
  for (const m of [...a, ...b]) mapa.set(m.id, m)
  return [...mapa.values()].sort((x, y) => x.created_at.localeCompare(y.created_at))
}

/**
 * Mensajes de una sala en tiempo real: historial paginado + Postgres Changes
 * (INSERT/DELETE) + Presence (quién está) + Broadcast (quién escribe).
 * La seguridad la ponen las RLS de chat_mensajes, no este hook.
 */
export function useChat(salaId: string, userId: string, userNombre: string) {
  const [mensajes, setMensajes] = useState<ChatMensaje[]>([])
  const [cargando, setCargando] = useState(true)
  const [hayMas, setHayMas] = useState(false)
  const [enLinea, setEnLinea] = useState<string[]>([])
  const [escribiendo, setEscribiendo] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const canalRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const ultimoAvisoRef = useRef(0)
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    let vivo = true

    // El estado arranca limpio: quien llama monta este hook con key={salaId}
    supabase
      .from('chat_mensajes')
      .select('id, sala_id, autor_id, autor_nombre, cuerpo, created_at')
      .eq('sala_id', salaId)
      .order('created_at', { ascending: false })
      .limit(PAGINA)
      .then(({ data, error: err }) => {
        if (!vivo) return
        if (err) setError('No se pudo cargar la conversación')
        const lista = ((data ?? []) as ChatMensaje[]).reverse()
        // unir y no pisar: un INSERT del canal puede haber llegado antes
        setMensajes(prev => unirPorId(prev, lista))
        setHayMas((data ?? []).length === PAGINA)
        setCargando(false)
      })

    const canal = supabase.channel(`chat:${salaId}`, {
      config: { presence: { key: userId } },
    })

    canal
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_mensajes', filter: `sala_id=eq.${salaId}` },
        payload => {
          const nuevo = payload.new as ChatMensaje
          setMensajes(prev => unirPorId(prev, [nuevo]))
          // si habló, ya no está "escribiendo"
          setEscribiendo(prev => prev.filter(n => n !== nuevo.autor_nombre))
        },
      )
      // Los DELETE de Realtime no admiten filtro: se descartan los de otras salas
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_mensajes' }, payload => {
        const id = (payload.old as { id?: string }).id
        if (id) setMensajes(prev => prev.filter(m => m.id !== id))
      })
      .on('presence', { event: 'sync' }, () => {
        const estado = canal.presenceState<{ nombre: string }>()
        setEnLinea(Object.values(estado).flatMap(v => v.map(p => p.nombre)))
      })
      .on('broadcast', { event: 'escribiendo' }, ({ payload }) => {
        const { userId: quien, nombre } = payload as { userId: string; nombre: string }
        if (quien === userId) return
        setEscribiendo(prev => (prev.includes(nombre) ? prev : [...prev, nombre]))
        const timers = timersRef.current
        clearTimeout(timers.get(quien))
        timers.set(
          quien,
          setTimeout(() => setEscribiendo(prev => prev.filter(n => n !== nombre)), TYPING_MS),
        )
      })
      .subscribe(async estado => {
        if (estado === 'SUBSCRIBED') await canal.track({ nombre: userNombre })
      })

    canalRef.current = canal
    const timers = timersRef.current

    return () => {
      vivo = false
      timers.forEach(clearTimeout)
      timers.clear()
      canalRef.current = null
      supabase.removeChannel(canal)
    }
  }, [salaId, userId, userNombre])

  const enviar = useCallback(
    async (texto: string) => {
      const cuerpo = texto.trim()
      if (!cuerpo) return false
      setError(null)
      const { data, error: err } = await supabase
        .from('chat_mensajes')
        .insert({ sala_id: salaId, autor_id: userId, cuerpo })
        .select('id, sala_id, autor_id, autor_nombre, cuerpo, created_at')
        .single()
      if (err || !data) {
        setError('No se pudo enviar el mensaje')
        return false
      }
      setMensajes(prev => unirPorId(prev, [data as ChatMensaje]))
      return true
    },
    [salaId, userId],
  )

  const borrar = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('chat_mensajes').delete().eq('id', id)
    if (err) setError('No se pudo borrar el mensaje')
    else setMensajes(prev => prev.filter(m => m.id !== id))
  }, [])

  const cargarAnteriores = useCallback(async () => {
    const primero = mensajes[0]
    if (!primero) return
    const { data } = await supabase
      .from('chat_mensajes')
      .select('id, sala_id, autor_id, autor_nombre, cuerpo, created_at')
      .eq('sala_id', salaId)
      .lt('created_at', primero.created_at)
      .order('created_at', { ascending: false })
      .limit(PAGINA)
    const lista = ((data ?? []) as ChatMensaje[]).reverse()
    setMensajes(prev => unirPorId(lista, prev))
    setHayMas((data ?? []).length === PAGINA)
  }, [mensajes, salaId])

  // Avisa "escribiendo" como mucho una vez cada 2 s
  const avisarEscribiendo = useCallback(() => {
    const ahora = Date.now()
    if (ahora - ultimoAvisoRef.current < 2000) return
    ultimoAvisoRef.current = ahora
    canalRef.current?.send({
      type: 'broadcast',
      event: 'escribiendo',
      payload: { userId, nombre: userNombre },
    })
  }, [userId, userNombre])

  return { mensajes, cargando, hayMas, enLinea, escribiendo, error, enviar, borrar, cargarAnteriores, avisarEscribiendo }
}
