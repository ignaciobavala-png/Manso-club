'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
  const [vuelos, setVuelos] = useState(0)
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
    setVuelos(v => v + 1)
    guardar('')
    onCancelarRespuesta()
    requestAnimationFrame(ajustarAlto)
    void onEnviar(cuerpo, respondeA)
  }

  if (baneado) {
    return (
      <p className="border-t border-white/10 bg-white/[0.05] p-4 text-center text-xs text-manso-cream/60 backdrop-blur-xl">
        No podés escribir en el chat.
      </p>
    )
  }

  return (
    <div className="border-t border-white/10 bg-white/[0.05] px-3 pb-3 pt-2 backdrop-blur-xl">
      <AnimatePresence initial={false}>
        {respondiendo && (
          <motion.div
            key="respuesta"
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 8 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2 rounded-xl border-l-4 border-manso-terra bg-manso-terra/10 px-3 py-1.5 text-xs">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[#ff8a6b]">Respondiendo a {respondiendo.autor_nombre ?? 'Usuario'}</p>
                <p className="truncate text-manso-cream/70">{respondiendo.cuerpo}</p>
              </div>
              <motion.button
                whileHover={{ rotate: 90, scale: 1.2 }}
                whileTap={{ scale: 0.85 }}
                onClick={onCancelarRespuesta}
                aria-label="Cancelar respuesta"
                className="text-manso-cream/50 hover:text-manso-cream"
              >
                <X size={14} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2">
        <div className="flex-1 rounded-3xl bg-white/10 ring-1 ring-white/15 transition focus-within:bg-white/15 focus-within:ring-2 focus-within:ring-manso-terra">
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
            className="block max-h-36 w-full resize-none bg-transparent px-4 py-2.5 text-[15px] text-manso-cream placeholder:text-manso-cream/40 focus:outline-none"
          />
        </div>
        <motion.button
          onClick={enviar}
          disabled={!texto.trim()}
          aria-label="Enviar"
          animate={{ scale: texto.trim() ? 1 : 0.9 }}
          whileHover={texto.trim() ? { scale: 1.1, rotate: -8 } : undefined}
          whileTap={{ scale: 0.82 }}
          transition={{ type: 'spring', stiffness: 450, damping: 20 }}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-manso-terra to-[#8f1d0f] text-manso-cream shadow-[0_6px_18px_rgba(188,41,21,0.45)] disabled:bg-none disabled:bg-white/15 disabled:shadow-none"
        >
          {/* el avión despega y vuelve cada vez que se envía */}
          <motion.span
            key={vuelos}
            initial={vuelos === 0 ? false : { x: -26, y: 26, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.12 }}
            className="flex"
          >
            <Send size={18} />
          </motion.span>
        </motion.button>
      </div>
      {texto.length > MAX * 0.8 && (
        <p className={`mt-1 pr-14 text-right text-[10px] ${texto.length >= MAX ? 'text-[#ff8a6b]' : 'text-manso-cream/50'}`}>
          {texto.length}/{MAX}
        </p>
      )}
    </div>
  )
}
