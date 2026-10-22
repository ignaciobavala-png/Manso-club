'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowLeft, Hash, Lock, LogOut, MoreVertical, Trash2 } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { etiquetaDia, mismoDia } from '@/lib/chat-utils'
import type { ChatConversacion, ChatMensaje } from '@/lib/types/chat'
import Avatar from './Avatar'
import Burbuja from './Burbuja'
import Composer from './Composer'

interface Props {
  conv: ChatConversacion
  userId: string
  userNombre: string
  baneado: boolean
  esAdmin: boolean
  /** Ids de quienes están conectados al chat ahora */
  enLinea: Set<string>
  retencionDias: number
  onVolver: () => void
  onLeer: () => void
  onSalir: () => void
  onEliminar: () => void
}

const RACHA_MS = 5 * 60_000

export default function Conversacion({
  conv,
  userId,
  userNombre,
  baneado,
  esAdmin,
  enLinea,
  retencionDias,
  onVolver,
  onLeer,
  onSalir,
  onEliminar,
}: Props) {
  const { sala, otro } = conv
  const {
    mensajes, reacciones, avatares, cargando, hayMas, escribiendo, error,
    enviar, reintentar, descartar, borrar, reaccionar, cargarAnteriores, avisarEscribiendo,
  } = useChat(sala.id, userId, userNombre)

  const [respondiendo, setRespondiendo] = useState<ChatMensaje | null>(null)
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [menu, setMenu] = useState(false)
  const [confirmando, setConfirmando] = useState<'salir' | 'eliminar' | null>(null)
  const [pegado, setPegado] = useState(true)
  const [vistoTs, setVistoTs] = useState('')

  const listaRef = useRef<HTMLDivElement>(null)
  const pegadoRef = useRef(true)
  const anclaRef = useRef<number | null>(null)
  const mensajesRef = useRef(mensajes)
  useEffect(() => {
    mensajesRef.current = mensajes
  }, [mensajes])

  // Sigue al último mensaje solo si la persona ya estaba abajo; al cargar historial conserva la posición
  useLayoutEffect(() => {
    const el = listaRef.current
    if (!el) return
    if (anclaRef.current !== null) {
      el.scrollTop += el.scrollHeight - anclaRef.current
      anclaRef.current = null
    } else if (pegadoRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [mensajes, escribiendo.length])

  // Mientras se mira esta sala, lo que llega cuenta como leído
  const ultimoId = mensajes[mensajes.length - 1]?.id
  useEffect(() => {
    if (ultimoId && pegado && !document.hidden) onLeer()
  }, [ultimoId, pegado, onLeer])

  const alScrollear = useCallback(() => {
    const el = listaRef.current
    if (!el) return
    const abajo = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    pegadoRef.current = abajo
    setPegado(abajo)
    if (abajo) setVistoTs(mensajesRef.current[mensajesRef.current.length - 1]?.created_at ?? '')
  }, [])

  const irAbajo = () => {
    const el = listaRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }

  const nuevos = useMemo(
    () => (pegado ? 0 : mensajes.filter(m => m.created_at > vistoTs && m.autor_id !== userId).length),
    [pegado, mensajes, vistoTs, userId],
  )

  const porId = useMemo(() => new Map(mensajes.map(m => [m.id, m])), [mensajes])

  const irACitado = (id: string) => {
    const el = document.getElementById(`msg-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('chat-resaltado')
    setTimeout(() => el.classList.remove('chat-resaltado'), 1400)
  }

  const cargarMas = () => {
    anclaRef.current = listaRef.current?.scrollHeight ?? null
    void cargarAnteriores()
  }

  const esGrupal = sala.tipo !== 'dm'
  const titulo = sala.tipo === 'dm' ? otro?.nombre : sala.nombre
  const otroEnLinea = otro ? enLinea.has(otro.id) : false
  const puedeBorrarSala =
    sala.tipo !== 'general' && sala.tipo !== 'dm' && (esAdmin || (sala.tipo === 'publica' && sala.creada_por === userId))

  const subtitulo =
    sala.tipo === 'dm'
      ? otroEnLinea
        ? 'En línea'
        : 'Desconectado'
      : sala.descripcion ?? (enLinea.size > 0 ? `${enLinea.size} en línea` : '')

  return (
    <>
      <header className="relative z-10 flex items-center gap-3 border-b border-white/10 bg-white/[0.05] px-4 py-3 backdrop-blur-xl">
        <button onClick={onVolver} className="text-manso-cream/60 hover:text-manso-cream md:hidden" aria-label="Volver a la lista">
          <ArrowLeft size={20} />
        </button>
        {sala.tipo === 'dm' && otro ? (
          <Avatar id={otro.id} nombre={otro.nombre} url={otro.avatar} tamano={38} />
        ) : (
          <motion.span
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 16 }}
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1f1b9a] to-manso-blue text-manso-cream shadow-md"
          >
            {sala.tipo === 'privada' ? <Lock size={16} /> : <Hash size={18} />}
          </motion.span>
        )}
        <div className="min-w-0 flex-1">
          <motion.h1
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.05 }}
            className="truncate text-sm font-black uppercase tracking-wide text-manso-cream"
          >
            {titulo}
          </motion.h1>
          <p className="flex items-center gap-1.5 truncate text-xs text-manso-cream/55">
            {sala.tipo === 'dm' && (
              <span className={`h-2 w-2 rounded-full ${otroEnLinea ? 'bg-emerald-400' : 'bg-manso-cream/25'}`} />
            )}
            {subtitulo}
          </p>
        </div>

        {(sala.tipo === 'privada' || puedeBorrarSala) && (
          <div className="relative">
            <button
              onClick={() => {
                setMenu(v => !v)
                setConfirmando(null)
              }}
              className="rounded-full p-2 text-manso-cream/60 hover:bg-white/10 hover:text-manso-cream"
              aria-label="Opciones de la sala"
            >
              <MoreVertical size={18} />
            </button>
            <AnimatePresence>
            {menu && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, scale: 0.85, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -6 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                style={{ transformOrigin: 'top right' }}
                className="absolute right-0 top-full z-30 mt-1 w-56 rounded-2xl bg-black/70 p-1.5 shadow-2xl ring-1 ring-white/15 backdrop-blur-2xl"
              >
                {sala.tipo === 'privada' &&
                  (confirmando === 'salir' ? (
                    <button onClick={onSalir} className="w-full rounded-xl bg-manso-terra px-3 py-2 text-left text-sm font-bold text-manso-cream">
                      Confirmar: salir de la sala
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmando('salir')}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-manso-cream hover:bg-white/10"
                    >
                      <LogOut size={15} /> Salir de la sala
                    </button>
                  ))}
                {puedeBorrarSala &&
                  (confirmando === 'eliminar' ? (
                    <button onClick={onEliminar} className="w-full rounded-xl bg-manso-terra px-3 py-2 text-left text-sm font-bold text-manso-cream">
                      Confirmar: eliminar para todos
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmando('eliminar')}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[#ff8a6b] hover:bg-manso-terra/20"
                    >
                      <Trash2 size={15} /> Eliminar sala
                    </button>
                  ))}
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        )}
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={listaRef}
          onScroll={alScrollear}
          onClick={() => {
            setSeleccionado(null)
            setMenu(false)
          }}
          className="h-full overflow-y-auto px-3 pb-2 pt-3 sm:px-5"
        >
          <p className="mx-auto mb-2 w-fit rounded-full bg-white/10 px-3 py-1 text-center text-[11px] text-manso-cream/55 backdrop-blur">
            Los mensajes se borran solos a los {retencionDias} días
          </p>

          {hayMas && (
            <button
              onClick={cargarMas}
              className="mx-auto my-2 block rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-manso-cream/80 ring-1 ring-white/15 backdrop-blur hover:bg-white/15"
            >
              Ver mensajes anteriores
            </button>
          )}
          {cargando && <p className="py-6 text-center text-xs text-manso-cream/50">Cargando…</p>}
          {!cargando && mensajes.length === 0 && (
            <div className="py-16 text-center">
              <motion.p
                className="inline-block text-4xl"
                animate={{ rotate: [0, 18, -10, 18, 0] }}
                transition={{ repeat: Infinity, repeatDelay: 1.5, duration: 1.2 }}
                style={{ transformOrigin: '70% 70%' }}
              >
                👋
              </motion.p>
              <p className="mt-2 text-sm font-semibold text-manso-cream">Acá todavía no hay nada</p>
              <p className="text-xs text-manso-cream/55">Escribí el primer mensaje.</p>
            </div>
          )}

          {mensajes.map((m, i) => {
            const prev = mensajes[i - 1]
            const sig = mensajes[i + 1]
            const cambiaDia = !prev || !mismoDia(prev.created_at, m.created_at)
            const mismaRacha = (a?: ChatMensaje, b?: ChatMensaje) =>
              !!a && !!b && a.autor_id === b.autor_id && mismoDia(a.created_at, b.created_at) &&
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime() < RACHA_MS
            const mio = m.autor_id === userId
            return (
              <div key={m.id}>
                {cambiaDia && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="my-3 flex justify-center"
                  >
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-manso-cream/70 ring-1 ring-white/15 backdrop-blur">
                      {etiquetaDia(m.created_at)}
                    </span>
                  </motion.div>
                )}
                <Burbuja
                  m={m}
                  mio={mio}
                  inicio={cambiaDia || !mismaRacha(prev, m)}
                  fin={!mismaRacha(m, sig)}
                  mostrarAutor={esGrupal}
                  avatar={avatares[m.autor_id]}
                  citado={m.responde_a ? porId.get(m.responde_a) : null}
                  reacciones={reacciones}
                  userId={userId}
                  seleccionado={seleccionado === m.id}
                  puedeBorrar={mio || esAdmin}
                  puedeEscribir={!baneado && !m.estado}
                  onSeleccionar={() => setSeleccionado(s => (s === m.id ? null : m.id))}
                  onReaccionar={e => {
                    setSeleccionado(null)
                    void reaccionar(m.id, e)
                  }}
                  onResponder={() => {
                    setSeleccionado(null)
                    setRespondiendo(m)
                  }}
                  onBorrar={() => void borrar(m.id)}
                  onReintentar={() => reintentar(m.id)}
                  onDescartar={() => descartar(m.id)}
                  onIrACitado={irACitado}
                />
              </div>
            )
          })}

          <AnimatePresence>
          {escribiendo.length > 0 && (
            <motion.div
              key="escribiendo"
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              className="mt-3 flex items-center gap-2 text-xs text-manso-cream/60"
              aria-live="polite"
            >
              <span className="flex gap-1 rounded-full bg-white/10 px-3 py-2 ring-1 ring-white/15 backdrop-blur">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-manso-cream/60"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </span>
              {escribiendo.join(', ')} {escribiendo.length > 1 ? 'están escribiendo' : 'está escribiendo'}
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {!pegado && (
            <motion.button
              key="abajo"
              onClick={irAbajo}
              initial={{ opacity: 0, y: 24, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.8 }}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className={`absolute bottom-3 right-4 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-manso-cream shadow-lg ${
                nuevos > 0 ? 'bg-manso-terra shadow-[0_0_18px_rgba(188,41,21,0.6)]' : 'bg-white/15 ring-1 ring-white/20 backdrop-blur-xl'
              }`}
              aria-label="Ir al último mensaje"
            >
              <motion.span animate={{ y: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 1.1 }} className="flex">
                <ArrowDown size={14} />
              </motion.span>
              {nuevos > 0 ? `${nuevos} nuevo${nuevos > 1 ? 's' : ''}` : 'Ir al final'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p role="alert" className="border-t border-red-400/30 bg-red-500/15 px-4 py-1.5 text-xs text-red-200">
          {error}
        </p>
      )}

      <Composer
        salaId={sala.id}
        baneado={baneado}
        respondiendo={respondiendo}
        onCancelarRespuesta={() => setRespondiendo(null)}
        onEnviar={(t, r) => {
          pegadoRef.current = true
          return enviar(t, r)
        }}
        onEscribiendo={avisarEscribiendo}
      />
    </>
  )
}
