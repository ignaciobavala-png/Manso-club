'use client'

import { useEffect, useMemo, useState } from 'react'
import { Hash, KeyRound, Lock, Plus, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { fechaCorta } from '@/lib/chat-utils'
import type { ChatConversacion } from '@/lib/types/chat'
import Avatar from './Avatar'
import ChatVynil from './ChatVynil'

interface Props {
  conversaciones: ChatConversacion[]
  cargando: boolean
  salaId: string | null
  noLeidos: Record<string, number>
  enLinea: Set<string>
  userId: string
  onElegir: (salaId: string) => void
  onAbrirDm: (userId: string) => void
  onNuevaSala: () => void
  onEntrarConClave: () => void
}

interface Persona {
  id: string
  display_name: string | null
  avatar_url: string | null
}

export default function Sidebar(p: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [personas, setPersonas] = useState<Persona[]>([])
  const q = busqueda.trim()

  // Buscar gente para abrir un DM
  useEffect(() => {
    if (q.length < 2) return
    const t = setTimeout(async () => {
      const literal = q.replace(/[\\%_]/g, c => `\\${c}`)
      const { data } = await supabase
        .from('user_profiles_publico')
        .select('id, display_name, avatar_url')
        .ilike('display_name', `%${literal}%`)
        .neq('id', p.userId)
        .limit(6)
      setPersonas((data ?? []) as Persona[])
    }, 250)
    return () => clearTimeout(t)
  }, [q, p.userId])

  const filtradas = useMemo(
    () =>
      p.conversaciones.filter(c => {
        if (q.length === 0) return true
        const n = (c.sala.tipo === 'dm' ? c.otro?.nombre : c.sala.nombre) ?? ''
        return n.toLowerCase().includes(q.toLowerCase())
      }),
    [p.conversaciones, q],
  )

  const salas = filtradas.filter(c => c.sala.tipo !== 'dm')
  const directos = filtradas.filter(c => c.sala.tipo === 'dm')

  const fila = (c: ChatConversacion) => {
    const dm = c.sala.tipo === 'dm'
    const nombre = dm ? c.otro?.nombre : c.sala.nombre
    const n = p.noLeidos[c.sala.id] ?? 0
    const activa = c.sala.id === p.salaId
    return (
      <li key={c.sala.id}>
        <button
          onClick={() => p.onElegir(c.sala.id)}
          className={`flex w-full items-center gap-3 border-l-4 px-4 py-2.5 text-left transition-colors ${
            activa ? 'border-manso-terra bg-manso-cream/15' : 'border-transparent hover:bg-manso-cream/10'
          }`}
        >
          {dm && c.otro ? (
            <Avatar id={c.otro.id} nombre={c.otro.nombre} url={c.otro.avatar} tamano={40} enLinea={p.enLinea.has(c.otro.id)} />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-manso-cream/15 text-manso-cream">
              {c.sala.tipo === 'privada' ? <Lock size={16} /> : <Hash size={18} />}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2">
              <span className={`truncate text-sm ${n > 0 ? 'font-black' : 'font-semibold'} text-manso-cream`}>
                {c.sala.tipo === 'general' ? 'Sala general' : nombre}
              </span>
              {c.ultimo && <span className="shrink-0 text-[10px] text-manso-cream/55">{fechaCorta(c.ultimo.created_at)}</span>}
            </span>
            <span className="flex items-center justify-between gap-2">
              <span className={`truncate text-xs ${n > 0 ? 'text-manso-cream' : 'text-manso-cream/60'}`}>
                {c.ultimo ? (dm ? '' : `${c.ultimo.autor_nombre ?? 'Usuario'}: `) + c.ultimo.cuerpo : 'Sin mensajes todavía'}
              </span>
              {n > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-manso-terra px-1.5 text-[11px] font-black text-manso-cream">
                  {n > 99 ? '99+' : n}
                </span>
              )}
            </span>
          </span>
        </button>
      </li>
    )
  }

  const titulo = (t: string) => (
    <h3 className="px-4 pb-1 pt-4 text-[10px] font-black uppercase tracking-[0.25em] text-manso-cream/50">{t}</h3>
  )

  return (
    <>
      <div className="px-4 pb-3 pt-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-manso-olive">En vivo</p>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-tight text-manso-cream">Manso Chat</h2>
          <div className="flex gap-1">
            <button
              onClick={p.onEntrarConClave}
              className="rounded-full bg-manso-cream/10 p-2 text-manso-cream transition hover:bg-manso-cream/20"
              aria-label="Entrar a una sala con clave"
              title="Entrar con clave"
            >
              <KeyRound size={16} />
            </button>
            <button
              onClick={p.onNuevaSala}
              className="rounded-full bg-manso-terra p-2 text-manso-cream transition hover:scale-105"
              aria-label="Crear una sala"
              title="Nueva sala"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-3 pb-2">
        <label className="flex items-center gap-2 rounded-full bg-manso-cream/10 px-3.5 py-2 focus-within:bg-manso-cream/20 focus-within:ring-1 focus-within:ring-manso-cream/40">
          <Search size={14} className="text-manso-cream/60" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar salas o personas"
            aria-label="Buscar salas o personas"
            className="w-full bg-transparent text-sm text-manso-cream placeholder:text-manso-cream/50 focus:outline-none"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        {q.length >= 2 && personas.length > 0 && (
          <>
            {titulo('Personas')}
            <ul>
              {personas.map(pe => (
                <li key={pe.id}>
                  <button
                    onClick={() => {
                      setBusqueda('')
                      p.onAbrirDm(pe.id)
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-manso-cream/10"
                  >
                    <Avatar id={pe.id} nombre={pe.display_name} url={pe.avatar_url} tamano={34} enLinea={p.enLinea.has(pe.id)} />
                    <span className="truncate text-sm text-manso-cream">{pe.display_name ?? 'Usuario'}</span>
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-manso-cream/50">Mensaje</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {p.cargando && (
          <ul className="space-y-2 px-4 pt-4" aria-label="Cargando">
            {[0, 1, 2].map(i => (
              <li key={i} className="flex animate-pulse items-center gap-3">
                <span className="h-10 w-10 rounded-full bg-manso-cream/15" />
                <span className="h-8 flex-1 rounded-lg bg-manso-cream/10" />
              </li>
            ))}
          </ul>
        )}

        {salas.length > 0 && (
          <>
            {titulo('Salas')}
            <ul>{salas.map(fila)}</ul>
          </>
        )}
        {directos.length > 0 && (
          <>
            {titulo('Mensajes directos')}
            <ul>{directos.map(fila)}</ul>
          </>
        )}
        {!p.cargando && filtradas.length === 0 && q.length > 0 && personas.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-manso-cream/60">No encontramos nada para “{q}”.</p>
        )}
      </div>

      <ChatVynil />
    </>
  )
}
