'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Check, Clock, Reply, Trash2 } from 'lucide-react'
import { REACCIONES, colorNombre, hora, trocear } from '@/lib/chat-utils'
import type { ChatMensaje, ChatReaccion } from '@/lib/types/chat'
import Avatar from './Avatar'

interface Props {
  m: ChatMensaje
  mio: boolean
  /** Primer mensaje de una racha de la misma persona: lleva nombre y avatar. */
  inicio: boolean
  fin: boolean
  /** Solo en salas con más de dos personas */
  mostrarAutor: boolean
  avatar: string | null | undefined
  citado: ChatMensaje | null | undefined
  reacciones: ChatReaccion[]
  userId: string
  seleccionado: boolean
  puedeBorrar: boolean
  puedeEscribir: boolean
  onSeleccionar: () => void
  onReaccionar: (emoji: string) => void
  onResponder: () => void
  onBorrar: () => void
  onReintentar: () => void
  onDescartar: () => void
  onIrACitado: (id: string) => void
}

const RESORTE = { type: 'spring', stiffness: 420, damping: 26 } as const

function Texto({ cuerpo, mio }: { cuerpo: string; mio: boolean }) {
  return (
    <>
      {trocear(cuerpo).map((t, i) =>
        t.url ? (
          <a
            key={i}
            href={t.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={e => e.stopPropagation()}
            className={`underline underline-offset-2 break-all ${mio ? 'text-manso-cream' : 'text-[#ff8a6b]'}`}
          >
            {t.texto}
          </a>
        ) : (
          <span key={i}>{t.texto}</span>
        ),
      )}
    </>
  )
}

export default function Burbuja(p: Props) {
  const { m, mio } = p
  const [hover, setHover] = useState(false)
  // Solo se anima la entrada de lo que acaba de llegar; el historial aparece sin fiesta
  const [reciente] = useState(() => Date.now() - new Date(m.created_at).getTime() < 15_000)

  const chips = REACCIONES.map(emoji => {
    const de = p.reacciones.filter(r => r.mensaje_id === m.id && r.emoji === emoji)
    return { emoji, n: de.length, mia: de.some(r => r.user_id === p.userId) }
  }).filter(c => c.n > 0)

  const redondeo = mio
    ? `rounded-2xl ${p.inicio ? '' : 'rounded-tr-md'} ${p.fin ? '' : 'rounded-br-md'}`
    : `rounded-2xl ${p.inicio ? '' : 'rounded-tl-md'} ${p.fin ? '' : 'rounded-bl-md'}`

  const barra = p.puedeEscribir && (hover || p.seleccionado)

  return (
    <motion.div
      id={`msg-${m.id}`}
      initial={reciente ? { opacity: 0, y: 18, x: mio ? 30 : -30, scale: 0.9 } : { opacity: 0 }}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      transition={reciente ? { type: 'spring', stiffness: 320, damping: 24 } : { duration: 0.25 }}
      style={{ transformOrigin: mio ? 'bottom right' : 'bottom left' }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      className={`relative flex gap-2 ${mio ? 'flex-row-reverse' : ''} ${p.inicio ? 'mt-3' : 'mt-0.5'}`}
    >
      {!mio && p.mostrarAutor && (
        <div className="w-8 shrink-0 pt-0.5">
          {p.inicio && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...RESORTE, delay: 0.05 }}>
              <Avatar id={m.autor_id} nombre={m.autor_nombre} url={p.avatar} tamano={32} />
            </motion.div>
          )}
        </div>
      )}

      <div className={`relative flex max-w-[85%] flex-col sm:max-w-[70%] ${mio ? 'items-end' : 'items-start'}`}>
        {/* Acciones: al pasar el mouse, o al tocar el mensaje en el celular */}
        <AnimatePresence>
          {barra && (
            <motion.div
              key="barra"
              initial={{ opacity: 0, scale: 0.7, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 6 }}
              transition={RESORTE}
              style={{ transformOrigin: mio ? 'bottom right' : 'bottom left' }}
              className={`absolute -top-10 z-20 ${mio ? 'right-0' : 'left-0'} flex items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-1 shadow-2xl ring-1 ring-white/20 backdrop-blur-2xl`}
            >
              {REACCIONES.map((e, i) => (
                <motion.button
                  key={e}
                  initial={{ scale: 0, y: 8 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ ...RESORTE, delay: 0.03 * i }}
                  whileHover={{ scale: 1.45, y: -4, rotate: i % 2 ? 8 : -8 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={ev => {
                    ev.stopPropagation()
                    p.onReaccionar(e)
                  }}
                  className="rounded-full px-1 text-lg"
                  aria-label={`Reaccionar con ${e}`}
                >
                  {e}
                </motion.button>
              ))}
              <span className="mx-0.5 h-4 w-px bg-white/15" />
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.85 }}
                onClick={ev => {
                  ev.stopPropagation()
                  p.onResponder()
                }}
                className="rounded-full p-1.5 text-manso-cream/70 hover:bg-white/10 hover:text-manso-cream"
                aria-label="Responder"
              >
                <Reply size={14} />
              </motion.button>
              {p.puedeBorrar && (
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={ev => {
                    ev.stopPropagation()
                    p.onBorrar()
                  }}
                  className="rounded-full p-1.5 text-[#ff8a6b] hover:bg-manso-terra/20"
                  aria-label="Borrar mensaje"
                >
                  <Trash2 size={14} />
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          onClick={p.onSeleccionar}
          whileTap={{ scale: 0.985 }}
          animate={{ opacity: m.estado === 'enviando' ? 0.6 : 1 }}
          className={`${redondeo} cursor-pointer px-3.5 py-2 shadow-sm ${
            mio
              ? 'bg-gradient-to-br from-manso-terra to-[#8f1d0f] text-manso-cream shadow-[0_4px_14px_rgba(188,41,21,0.3)]'
              : 'bg-white/10 text-manso-cream ring-1 ring-white/20 backdrop-blur-md'
          } ${m.estado === 'error' ? 'ring-2 ring-red-500' : ''}`}
        >
          {!mio && p.mostrarAutor && p.inicio && (
            <p className={`mb-0.5 text-[11px] font-bold ${colorNombre(m.autor_id)}`}>{m.autor_nombre ?? 'Usuario'}</p>
          )}

          {m.responde_a && (
            <button
              onClick={e => {
                e.stopPropagation()
                if (p.citado) p.onIrACitado(p.citado.id)
              }}
              className={`mb-1.5 block w-full rounded-lg border-l-2 px-2 py-1 text-left text-xs ${
                mio ? 'border-manso-cream/70 bg-black/20' : 'border-manso-terra bg-white/10'
              }`}
            >
              <span className="block font-bold opacity-80">{p.citado?.autor_nombre ?? 'Mensaje anterior'}</span>
              <span className="line-clamp-2 opacity-80">{p.citado ? p.citado.cuerpo : 'Ya no está disponible'}</span>
            </button>
          )}

          <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">
            <Texto cuerpo={m.cuerpo} mio={mio} />
          </p>

          <div className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${mio ? 'text-manso-cream/80' : 'text-manso-cream/50'}`}>
            {hora(m.created_at)}
            {mio && m.estado === 'enviando' && (
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
                <Clock size={10} aria-label="Enviando" />
              </motion.span>
            )}
            {mio && m.estado === 'error' && <AlertCircle size={10} aria-label="No se envió" />}
            {mio && !m.estado && (
              <motion.span initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={RESORTE}>
                <Check size={11} aria-label="Enviado" />
              </motion.span>
            )}
          </div>
        </motion.div>

        {m.estado === 'error' && (
          <p className="mt-1 text-xs text-red-300">
            No se envió ·{' '}
            <button onClick={p.onReintentar} className="font-bold underline">
              Reintentar
            </button>{' '}
            ·{' '}
            <button onClick={p.onDescartar} className="underline">
              Descartar
            </button>
          </p>
        )}

        <div className={`-mt-1.5 flex flex-wrap gap-1 ${mio ? 'justify-end' : 'justify-start'}`}>
          <AnimatePresence initial={false}>
            {chips.map(c => (
              <motion.button
                key={c.emoji}
                layout
                initial={{ scale: 0, y: -6 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 520, damping: 20 }}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.88 }}
                onClick={() => p.puedeEscribir && p.onReaccionar(c.emoji)}
                className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs shadow-sm ring-1 ${
                  c.mia ? 'bg-manso-terra/30 text-manso-cream ring-manso-terra' : 'bg-white/10 text-manso-cream ring-white/20 backdrop-blur-md'
                }`}
              >
                <span>{c.emoji}</span>
                <motion.span key={c.n} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-semibold">
                  {c.n}
                </motion.span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
