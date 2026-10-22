'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, X } from 'lucide-react'
import type { ChatMensaje } from '@/lib/types/chat'

interface Props {
  salaId: string
  baneado: boolean
  respondiendo: ChatMensaje | null
  onCancelarRespuesta: () => void
  onEnviar: (texto: string, respondeA: string | null) => Promise<boolean>
  onEscribiendo: () => void
}

const MAX = 1000
const BORRADOR = (salaId: string) => `mansochat:borrador:${salaId}`

function leerBorrador(salaId: string) {
  try {
    return sessionStorage.getItem(BORRADOR(salaId)) ?? ''
  } catch {
    return ''
  }
}

/** Caja de texto: Enter envía, Shift+Enter hace salto de línea, y el borrador sobrevive al cambio de sala. */
export default function Composer({ salaId, baneado, respondiendo, onCancelarRespuesta, onEnviar, onEscribiendo }: Props) {
  const [texto, setTexto] = useState(() => leerBorrador(salaId))
  const ref = useRef<HTMLTextAreaElement>(null)

  const ajustarAlto = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }

  useEffect(ajustarAlto, [])
  useEffect(() => {
    if (respondiendo) ref.current?.focus()
  }, [respondiendo])

  const guardar = (v: string) => {
    try {
      if (v) sessionStorage.setItem(BORRADOR(salaId), v)
      else sessionStorage.removeItem(BORRADOR(salaId))
    } catch {
      /* sin storage */
    }
  }

  const enviar = () => {
    const cuerpo = texto.trim()
    if (!cuerpo) return
    // Se vacía en el acto: el mensaje ya está en pantalla como "enviando" y, si falla, se reintenta desde ahí.
    const respondeA = respondiendo?.id ?? null
    setTexto('')
    guardar('')
    onCancelarRespuesta()
    requestAnimationFrame(ajustarAlto)
    void onEnviar(cuerpo, respondeA)
  }

  if (baneado) {
    return (
      <p className="border-t border-black/10 bg-white p-4 text-center text-xs text-manso-black/60">
        No podés escribir en el chat.
      </p>
    )
  }

  return (
    <div className="border-t border-black/10 bg-white px-3 pb-3 pt-2">
      {respondiendo && (
        <div className="mb-2 flex items-start gap-2 rounded-xl border-l-4 border-manso-terra bg-manso-black/5 px-3 py-1.5 text-xs">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-manso-terra">Respondiendo a {respondiendo.autor_nombre ?? 'Usuario'}</p>
            <p className="truncate text-manso-black/70">{respondiendo.cuerpo}</p>
          </div>
          <button onClick={onCancelarRespuesta} aria-label="Cancelar respuesta" className="text-manso-black/50 hover:text-manso-black">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 rounded-3xl bg-manso-cream/60 ring-1 ring-black/10 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-manso-terra">
          <textarea
            ref={ref}
            value={texto}
            onChange={e => {
              setTexto(e.target.value)
              guardar(e.target.value)
              ajustarAlto()
              if (e.target.value) onEscribiendo()
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                enviar()
              }
              if (e.key === 'Escape' && respondiendo) onCancelarRespuesta()
            }}
            maxLength={MAX}
            rows={1}
            placeholder="Escribí un mensaje…"
            aria-label="Mensaje"
            className="block max-h-36 w-full resize-none bg-transparent px-4 py-2.5 text-[15px] text-manso-black placeholder:text-manso-black/40 focus:outline-none"
          />
        </div>
        <button
          onClick={enviar}
          disabled={!texto.trim()}
          aria-label="Enviar"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-manso-terra text-manso-cream shadow-md transition hover:scale-105 hover:bg-manso-terra/90 disabled:scale-100 disabled:bg-manso-black/15 disabled:shadow-none"
        >
          <Send size={18} />
        </button>
      </div>
      {texto.length > MAX * 0.8 && (
        <p className={`mt-1 pr-14 text-right text-[10px] ${texto.length >= MAX ? 'text-manso-terra' : 'text-manso-black/50'}`}>
          {texto.length}/{MAX}
        </p>
      )}
    </div>
  )
}
