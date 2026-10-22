'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { useChat } from '@/hooks/useChat'

interface Props {
  salaId: string
  userId: string
  userNombre: string
  baneado: boolean
  esAdmin: boolean
}

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })

export default function Conversacion({ salaId, userId, userNombre, baneado, esAdmin }: Props) {
  const { mensajes, cargando, hayMas, enLinea, escribiendo, error, enviar, borrar, cargarAnteriores, avisarEscribiendo } =
    useChat(salaId, userId, userNombre)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const listaRef = useRef<HTMLDivElement>(null)
  const pegadoAbajo = useRef(true)

  // Sigue al último mensaje solo si la persona ya estaba abajo
  useLayoutEffect(() => {
    const el = listaRef.current
    if (el && pegadoAbajo.current) el.scrollTop = el.scrollHeight
  }, [mensajes])

  useEffect(() => {
    pegadoAbajo.current = true
  }, [salaId])

  async function onEnviar(e: React.FormEvent) {
    e.preventDefault()
    if (enviando || !texto.trim()) return
    setEnviando(true)
    const ok = await enviar(texto)
    if (ok) {
      setTexto('')
      pegadoAbajo.current = true
    }
    setEnviando(false)
  }

  const otrosEnLinea = enLinea.length > 0 ? enLinea.length : 0

  return (
    <>
      <div
        ref={listaRef}
        onScroll={e => {
          const el = e.currentTarget
          pegadoAbajo.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
        }}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {hayMas && (
          <button onClick={cargarAnteriores} className="mx-auto block text-xs text-manso-cream/50 hover:text-manso-cream">
            Ver mensajes anteriores
          </button>
        )}
        {cargando && <p className="text-center text-xs text-manso-cream/40">Cargando…</p>}
        {!cargando && mensajes.length === 0 && (
          <p className="text-center text-xs text-manso-cream/40">Todavía no hay mensajes. Escribí el primero.</p>
        )}
        {mensajes.map(m => {
          const mio = m.autor_id === userId
          return (
            <div key={m.id} className={`group flex ${mio ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3 py-2 ${mio ? 'bg-manso-terra text-manso-cream' : 'bg-manso-cream/10 text-manso-cream'}`}>
                {!mio && <p className="mb-0.5 text-[11px] font-bold text-manso-olive">{m.autor_nombre ?? 'Usuario'}</p>}
                <p className="whitespace-pre-wrap break-words text-sm">{m.cuerpo}</p>
                <div className="mt-1 flex items-center justify-end gap-2 text-[10px] text-manso-cream/50">
                  {(mio || esAdmin) && (
                    <button
                      onClick={() => borrar(m.id)}
                      className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                      aria-label="Borrar mensaje"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                  {hora(m.created_at)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="h-5 px-4 text-[11px] text-manso-cream/40">
        {escribiendo.length > 0
          ? `${escribiendo.join(', ')} ${escribiendo.length > 1 ? 'están escribiendo…' : 'está escribiendo…'}`
          : otrosEnLinea > 1
            ? `${otrosEnLinea} en línea`
            : ''}
      </div>

      {error && <p className="px-4 pb-1 text-xs text-manso-terra">{error}</p>}

      {baneado ? (
        <p className="border-t border-manso-cream/10 p-4 text-center text-xs text-manso-cream/50">
          No podés escribir en el chat.
        </p>
      ) : (
        <form onSubmit={onEnviar} className="flex items-end gap-2 border-t border-manso-cream/10 p-3">
          <textarea
            value={texto}
            onChange={e => {
              setTexto(e.target.value)
              avisarEscribiendo()
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                e.currentTarget.form?.requestSubmit()
              }
            }}
            maxLength={1000}
            rows={1}
            placeholder="Escribí un mensaje"
            className="max-h-32 min-h-[40px] flex-1 resize-none bg-manso-cream/5 px-3 py-2 text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none"
          />
          <button
            type="submit"
            disabled={enviando || !texto.trim()}
            className="flex h-10 w-10 items-center justify-center bg-manso-cream text-manso-black disabled:opacity-40"
            aria-label="Enviar"
          >
            <Send size={16} />
          </button>
        </form>
      )}
    </>
  )
}
