'use client'

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
            className={`underline underline-offset-2 break-all ${mio ? 'text-manso-cream' : 'text-manso-terra'}`}
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

  // Agrupa las reacciones por emoji
  const chips = REACCIONES.map(emoji => {
    const de = p.reacciones.filter(r => r.mensaje_id === m.id && r.emoji === emoji)
    return { emoji, n: de.length, mia: de.some(r => r.user_id === p.userId) }
  }).filter(c => c.n > 0)

  const redondeo = mio
    ? `rounded-2xl ${p.inicio ? '' : 'rounded-tr-md'} ${p.fin ? '' : 'rounded-br-md'}`
    : `rounded-2xl ${p.inicio ? '' : 'rounded-tl-md'} ${p.fin ? '' : 'rounded-bl-md'}`

  return (
    <div
      id={`msg-${m.id}`}
      className={`group relative flex gap-2 ${mio ? 'flex-row-reverse' : ''} ${p.inicio ? 'mt-3' : 'mt-0.5'}`}
    >
      {!mio && p.mostrarAutor && (
        <div className="w-8 shrink-0 pt-0.5">
          {p.inicio && <Avatar id={m.autor_id} nombre={m.autor_nombre} url={p.avatar} tamano={32} />}
        </div>
      )}

      <div className={`relative flex max-w-[85%] flex-col sm:max-w-[70%] ${mio ? 'items-end' : 'items-start'}`}>
        {/* Acciones: al pasar el mouse, o al tocar el mensaje en el celular */}
        {p.puedeEscribir && (
          <div
            className={`absolute -top-9 z-20 ${mio ? 'right-0' : 'left-0'} ${
              p.seleccionado ? 'flex' : 'hidden sm:group-hover:flex'
            } items-center gap-0.5 rounded-full bg-white px-1.5 py-1 shadow-lg ring-1 ring-black/10`}
          >
            {REACCIONES.map(e => (
              <button
                key={e}
                onClick={ev => {
                  ev.stopPropagation()
                  p.onReaccionar(e)
                }}
                className="rounded-full px-1 text-base transition-transform hover:scale-125"
                aria-label={`Reaccionar con ${e}`}
              >
                {e}
              </button>
            ))}
            <span className="mx-0.5 h-4 w-px bg-black/10" />
            <button
              onClick={ev => {
                ev.stopPropagation()
                p.onResponder()
              }}
              className="rounded-full p-1.5 text-manso-black/60 hover:bg-black/5 hover:text-manso-black"
              aria-label="Responder"
            >
              <Reply size={14} />
            </button>
            {p.puedeBorrar && (
              <button
                onClick={ev => {
                  ev.stopPropagation()
                  p.onBorrar()
                }}
                className="rounded-full p-1.5 text-manso-terra/80 hover:bg-manso-terra/10 hover:text-manso-terra"
                aria-label="Borrar mensaje"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}

        <div
          onClick={p.onSeleccionar}
          className={`${redondeo} cursor-pointer px-3.5 py-2 shadow-sm transition-opacity ${
            mio ? 'bg-manso-terra text-manso-cream' : 'bg-white text-manso-black ring-1 ring-black/5'
          } ${m.estado === 'enviando' ? 'opacity-60' : ''} ${m.estado === 'error' ? 'ring-2 ring-red-500' : ''}`}
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
                mio ? 'border-manso-cream/70 bg-black/15' : 'border-manso-terra bg-manso-black/5'
              }`}
            >
              <span className="block font-bold opacity-80">{p.citado?.autor_nombre ?? 'Mensaje anterior'}</span>
              <span className="line-clamp-2 opacity-80">{p.citado ? p.citado.cuerpo : 'Ya no está disponible'}</span>
            </button>
          )}

          <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">
            <Texto cuerpo={m.cuerpo} mio={mio} />
          </p>

          <div className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${mio ? 'text-manso-cream/80' : 'text-manso-black/45'}`}>
            {hora(m.created_at)}
            {mio && m.estado === 'enviando' && <Clock size={10} aria-label="Enviando" />}
            {mio && m.estado === 'error' && <AlertCircle size={10} aria-label="No se envió" />}
            {mio && !m.estado && <Check size={11} aria-label="Enviado" />}
          </div>
        </div>

        {m.estado === 'error' && (
          <p className="mt-1 text-xs text-red-600">
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

        {chips.length > 0 && (
          <div className={`-mt-1.5 flex flex-wrap gap-1 ${mio ? 'justify-end' : 'justify-start'}`}>
            {chips.map(c => (
              <button
                key={c.emoji}
                onClick={() => p.puedeEscribir && p.onReaccionar(c.emoji)}
                className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs shadow-sm ring-1 transition-colors ${
                  c.mia ? 'bg-manso-terra/15 ring-manso-terra text-manso-black' : 'bg-white ring-black/10 text-manso-black'
                }`}
              >
                <span>{c.emoji}</span>
                <span className="font-semibold">{c.n}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
