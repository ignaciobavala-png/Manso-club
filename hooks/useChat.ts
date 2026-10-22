'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ChatMensaje, ChatReaccion } from '@/lib/types/chat'

const PAGINA = 50
const TYPING_MS = 3000
const COLUMNAS = 'id, sala_id, autor_id, autor_nombre, cuerpo, created_at, responde_a'

function unirPorId(a: ChatMensaje[], b: ChatMensaje[]) {
  const mapa = new Map<string, ChatMensaje>()
  for (const m of [...a, ...b]) mapa.set(m.id, m)
  return [...mapa.values()].sort((x, y) => x.created_at.localeCompare(y.created_at))
}

/**
 * Una sala en tiempo real: historial paginado, mensajes y reacciones por
 * Postgres Changes, "escribiendo…" por Broadcast. El envío es optimista: el
 * mensaje aparece al instante con el id que va a tener en la base, y el eco de
 * Realtime lo reconoce por ese id en vez de duplicarlo.
 * La seguridad la ponen las RLS, no este hook.
 *
 * El estado arranca limpio porque quien lo usa monta el componente con key={salaId}.
 */
export function useChat(salaId: string, userId: string, userNombre: string) {
  const [mensajes, setMensajes] = useState<ChatMensaje[]>([])
  const [reacciones, setReacciones] = useState<ChatReaccion[]>([])
  const [avatares, setAvatares] = useState<Record<string, string | null>>({})
  const [cargando, setCargando] = useState(true)
  const [hayMas, setHayMas] = useState(false)
  const [escribiendo, setEscribiendo] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const canalRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const ultimoAvisoRef = useRef(0)
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const pedidosRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    let vivo = true

    supabase
      .from('chat_mensajes')
      .select(COLUMNAS)
      .eq('sala_id', salaId)
      .order('created_at', { ascending: false })
      .limit(PAGINA)
      .then(({ data, error: err }) => {
        if (!vivo) return
        if (err) setError('No se pudo cargar la conversación')
        const lista = ((data ?? []) as ChatMensaje[]).reverse()
        setMensajes(prev => unirPorId(prev, lista))
        setHayMas((data ?? []).length === PAGINA)
        setCargando(false)
      })

    supabase
      .from('chat_reacciones')
      .select('mensaje_id, user_id, emoji')
      .eq('sala_id', salaId)
      .limit(2000)
      .then(({ data }) => {
        if (!vivo) return
        const lista = (data ?? []) as ChatReaccion[]
        setReacciones(prev => {
          const clave = (r: ChatReaccion) => `${r.mensaje_id}|${r.user_id}|${r.emoji}`
          const vistas = new Set(prev.map(clave))
          return [...prev, ...lista.filter(r => !vistas.has(clave(r)))]
        })
      })

    const canal = supabase.channel(`chat:${salaId}`)
    const timers = timersRef.current

    canal
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_mensajes', filter: `sala_id=eq.${salaId}` },
        payload => {
          const nuevo = payload.new as ChatMensaje
          setMensajes(prev => unirPorId(prev, [nuevo]))
          setEscribiendo(prev => prev.filter(n => n !== nuevo.autor_nombre))
        },
      )
      // Los DELETE de Realtime no admiten filtro: se descarta por id
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_mensajes' }, payload => {
        const id = (payload.old as { id?: string }).id
        if (id) setMensajes(prev => prev.filter(m => m.id !== id))
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_reacciones', filter: `sala_id=eq.${salaId}` },
        payload => {
          const r = payload.new as ChatReaccion
          setReacciones(prev =>
            prev.some(x => x.mensaje_id === r.mensaje_id && x.user_id === r.user_id && x.emoji === r.emoji)
              ? prev
              : [...prev, { mensaje_id: r.mensaje_id, user_id: r.user_id, emoji: r.emoji }],
          )
        },
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_reacciones' }, payload => {
        const r = payload.old as Partial<ChatReaccion>
        setReacciones(prev =>
          prev.filter(x => !(x.mensaje_id === r.mensaje_id && x.user_id === r.user_id && x.emoji === r.emoji)),
        )
      })
      .on('broadcast', { event: 'escribiendo' }, ({ payload }) => {
        const { userId: quien, nombre } = payload as { userId: string; nombre: string }
        if (quien === userId) return
        setEscribiendo(prev => (prev.includes(nombre) ? prev : [...prev, nombre]))
        clearTimeout(timers.get(quien))
        timers.set(
          quien,
          setTimeout(() => setEscribiendo(prev => prev.filter(n => n !== nombre)), TYPING_MS),
        )
      })
      .subscribe()

    canalRef.current = canal

    return () => {
      vivo = false
      timers.forEach(clearTimeout)
      timers.clear()
      canalRef.current = null
      supabase.removeChannel(canal)
    }
  }, [salaId, userId])

  // Avatares de quienes escriben: una consulta por tanda de autores nuevos
  useEffect(() => {
    const faltan = [...new Set(mensajes.map(m => m.autor_id))].filter(id => !pedidosRef.current.has(id))
    if (faltan.length === 0) return
    faltan.forEach(id => pedidosRef.current.add(id))
    supabase
      .from('user_profiles_publico')
      .select('id, avatar_url')
      .in('id', faltan)
      .then(({ data }) => {
        setAvatares(prev => {
          const sig = { ...prev }
          for (const id of faltan) sig[id] = null
          for (const p of data ?? []) sig[p.id as string] = (p.avatar_url as string | null) ?? null
          return sig
        })
      })
  }, [mensajes])

  const insertar = useCallback(
    async (m: ChatMensaje) => {
      const { data, error: err } = await supabase
        .from('chat_mensajes')
        .insert({ id: m.id, sala_id: salaId, autor_id: userId, cuerpo: m.cuerpo, responde_a: m.responde_a })
        .select(COLUMNAS)
        .single()
      if (err || !data) {
        setMensajes(prev => prev.map(x => (x.id === m.id ? { ...x, estado: 'error' as const } : x)))
        setError(err?.message?.includes('rápido') ? 'Estás mandando mensajes muy rápido' : 'No se pudo enviar el mensaje')
        return false
      }
      setMensajes(prev => unirPorId(prev.filter(x => x.id !== m.id), [data as ChatMensaje]))
      return true
    },
    [salaId, userId],
  )

  const enviar = useCallback(
    async (texto: string, respondeA: string | null = null) => {
      const cuerpo = texto.trim()
      if (!cuerpo) return false
      setError(null)
      const optimista: ChatMensaje = {
        id: crypto.randomUUID(),
        sala_id: salaId,
        autor_id: userId,
        autor_nombre: userNombre,
        cuerpo,
        created_at: new Date().toISOString(),
        responde_a: respondeA,
        estado: 'enviando',
      }
      setMensajes(prev => unirPorId(prev, [optimista]))
      return insertar(optimista)
    },
    [salaId, userId, userNombre, insertar],
  )

  const reintentar = useCallback(
    (id: string) => {
      const m = mensajes.find(x => x.id === id)
      if (!m) return
      setError(null)
      setMensajes(prev => prev.map(x => (x.id === id ? { ...x, estado: 'enviando' as const } : x)))
      void insertar(m)
    },
    [mensajes, insertar],
  )

  const descartar = useCallback((id: string) => setMensajes(prev => prev.filter(m => m.id !== id)), [])

  const borrar = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('chat_mensajes').delete().eq('id', id)
    if (err) setError('No se pudo borrar el mensaje')
    else setMensajes(prev => prev.filter(m => m.id !== id))
  }, [])

  /** Pone o saca la reacción propia (optimista; si la base la rechaza, se revierte). */
  const reaccionar = useCallback(
    async (mensajeId: string, emoji: string) => {
      const mia = (x: ChatReaccion) => x.mensaje_id === mensajeId && x.user_id === userId && x.emoji === emoji
      const yaEsta = reacciones.some(mia)
      if (yaEsta) {
        setReacciones(prev => prev.filter(x => !mia(x)))
        const { error: err } = await supabase
          .from('chat_reacciones')
          .delete()
          .match({ mensaje_id: mensajeId, user_id: userId, emoji })
        if (err) setReacciones(prev => [...prev, { mensaje_id: mensajeId, user_id: userId, emoji }])
      } else {
        setReacciones(prev => [...prev, { mensaje_id: mensajeId, user_id: userId, emoji }])
        const { error: err } = await supabase
          .from('chat_reacciones')
          .insert({ mensaje_id: mensajeId, user_id: userId, emoji })
        if (err) setReacciones(prev => prev.filter(x => !mia(x)))
      }
    },
    [reacciones, userId],
  )

  const cargarAnteriores = useCallback(async () => {
    const primero = mensajes[0]
    if (!primero) return
    const { data } = await supabase
      .from('chat_mensajes')
      .select(COLUMNAS)
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
    canalRef.current?.send({ type: 'broadcast', event: 'escribiendo', payload: { userId, nombre: userNombre } })
  }, [userId, userNombre])

  return {
    mensajes,
    reacciones,
    avatares,
    cargando,
    hayMas,
    escribiendo,
    error,
    enviar,
    reintentar,
    descartar,
    borrar,
    reaccionar,
    cargarAnteriores,
    avisarEscribiendo,
  }
}
