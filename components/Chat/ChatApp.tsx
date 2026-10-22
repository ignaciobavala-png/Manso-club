'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { ChatConversacion } from '@/lib/types/chat'
import Conversacion from './Conversacion'
import ChatVynil from './ChatVynil'

interface Props {
  userId: string
  userNombre: string
  baneado: boolean
  esAdmin: boolean
  conversaciones: ChatConversacion[]
  salaInicial: string | null
}

interface Resultado {
  id: string
  display_name: string | null
}

export default function ChatApp({ userId, userNombre, baneado, esAdmin, conversaciones, salaInicial }: Props) {
  const router = useRouter()
  const [salaId, setSalaId] = useState<string | null>(salaInicial)
  // en mobile se ve la lista o la conversación, no las dos
  const [verConversacion, setVerConversacion] = useState(salaInicial !== null && salaInicial !== conversaciones[0]?.sala.id)
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<Resultado[]>([])

  const activa = useMemo(() => conversaciones.find(c => c.sala.id === salaId) ?? null, [conversaciones, salaId])

  useEffect(() => {
    const q = busqueda.trim()
    if (q.length < 2) return
    const t = setTimeout(async () => {
      const literal = q.replace(/[\\%_]/g, c => `\\${c}`)
      const { data } = await supabase
        .from('user_profiles_publico')
        .select('id, display_name')
        .ilike('display_name', `%${literal}%`)
        .neq('id', userId)
        .limit(8)
      setResultados((data ?? []) as Resultado[])
    }, 250)
    return () => clearTimeout(t)
  }, [busqueda, userId])

  return (
    <div className="min-h-screen bg-manso-black pt-24 pb-6 px-0 md:px-8">
      <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-5xl overflow-hidden border border-manso-cream/10">
        <aside className={`${verConversacion ? 'hidden' : 'flex'} w-full flex-col border-r border-manso-cream/10 md:flex md:w-72`}>
          <div className="border-b border-manso-cream/10 px-4 pb-1 pt-4">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-manso-olive">En vivo</p>
            <h2 className="text-lg font-black uppercase tracking-tight text-manso-cream">Manso Chat</h2>
          </div>
          <div className="border-b border-manso-cream/10 p-3">
            <label className="flex items-center gap-2 bg-manso-cream/5 px-3 py-2">
              <Search size={14} className="text-manso-cream/40" />
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar a alguien…"
                className="w-full bg-transparent text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none"
              />
            </label>
            {busqueda.trim().length >= 2 && resultados.length > 0 && (
              <ul className="mt-2 border border-manso-cream/10">
                {resultados.map(r => (
                  <li key={r.id}>
                    <button
                      onClick={() => router.push(`/mansochat?dm=${r.id}`)}
                      className="w-full px-3 py-2 text-left text-sm text-manso-cream hover:bg-manso-cream/10"
                    >
                      {r.display_name ?? 'Usuario'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <ul className="flex-1 overflow-y-auto">
            {conversaciones.map(c => (
              <li key={c.sala.id}>
                <button
                  onClick={() => {
                    setSalaId(c.sala.id)
                    setVerConversacion(true)
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-manso-cream/5 ${
                    c.sala.id === salaId ? 'bg-manso-cream/10' : ''
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-manso-blue text-sm font-bold text-manso-cream">
                    {c.otro?.avatar ? (
                      <img src={c.otro.avatar} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      (c.otro?.nombre ?? '#')[0].toUpperCase()
                    )}
                  </span>
                  <span className="truncate text-sm text-manso-cream">
                    {c.sala.tipo === 'general' ? 'Sala general' : c.otro?.nombre}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <ChatVynil />
        </aside>

        <section className={`${verConversacion ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col md:flex`}>
          {activa ? (
            <>
              <header className="flex items-center gap-3 border-b border-manso-cream/10 px-4 py-3">
                <button
                  onClick={() => setVerConversacion(false)}
                  className="text-manso-cream/60 hover:text-manso-cream md:hidden"
                  aria-label="Volver a la lista"
                >
                  <ArrowLeft size={18} />
                </button>
                <h1 className="truncate text-sm font-bold uppercase tracking-wider text-manso-cream">
                  {activa.sala.tipo === 'general' ? 'Sala general' : activa.otro?.nombre}
                </h1>
              </header>
              <Conversacion
                key={activa.sala.id}
                salaId={activa.sala.id}
                userId={userId}
                userNombre={userNombre}
                baneado={baneado}
                esAdmin={esAdmin}
              />
            </>
          ) : (
            <p className="m-auto text-sm text-manso-cream/40">No hay conversaciones todavía.</p>
          )}
        </section>
      </div>
    </div>
  )
}
