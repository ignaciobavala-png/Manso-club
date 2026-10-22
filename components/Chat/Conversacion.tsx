'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
      <header className="relative flex items-center gap-3 border-b border-black/10 bg-white px-4 py-3">
        <button onClick={onVolver} className="text-manso-black/60 hover:text-manso-black md:hidden" aria-label="Volver a la lista">
          <ArrowLeft size={20} />
        </button>
        {sala.tipo === 'dm' && otro ? (
          <Avatar id={otro.id} nombre={otro.nombre} url={otro.avatar} tamano={38} />
        ) : (
          <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-manso-blue text-manso-cream">
            {sala.tipo === 'privada' ? <Lock size={16} /> : <Hash size={18} />}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-black uppercase tracking-wide text-manso-black">{titulo}</h1>
          <p className="flex items-center gap-1.5 truncate text-xs text-manso-black/55">
            {sala.tipo === 'dm' && (
              <span className={`h-2 w-2 rounded-full ${otroEnLinea ? 'bg-emerald-500' : 'bg-manso-black/25'}`} />
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
              className="rounded-full p-2 text-manso-black/60 hover:bg-black/5 hover:text-manso-black"
              aria-label="Opciones de la sala"
            >
              <MoreVertical size={18} />
            </button>
            {menu && (
              <div className="absolute right-0 top-full z-30 mt-1 w-56 rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-black/10">
                {sala.tipo === 'privada' &&
                  (confirmando === 'salir' ? (
                    <button onClick={onSalir} className="w-full rounded-xl bg-manso-terra px-3 py-2 text-left text-sm font-bold text-manso-cream">
                      Confirmar: salir de la sala
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmando('salir')}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-manso-black hover:bg-black/5"
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
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-manso-terra hover:bg-manso-terra/10"
                    >
                      <Trash2 size={15} /> Eliminar sala
                    </button>
                  ))}
              </div>
            )}
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
          <p className="mx-auto mb-2 w-fit rounded-full bg-manso-black/5 px-3 py-1 text-center text-[11px] text-manso-black/55">
            Los mensajes se borran solos a los {retencionDias} días
          </p>

          {hayMas && (
            <button
              onClick={cargarMas}
              className="mx-auto my-2 block rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-manso-black/70 shadow-sm ring-1 ring-black/10 hover:text-manso-black"
            >
              Ver mensajes anteriores
            </button>
          )}
          {cargando && <p className="py-6 text-center text-xs text-manso-black/50">Cargando…</p>}
          {!cargando && mensajes.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-3xl">👋</p>
              <p className="mt-2 text-sm font-semibold text-manso-black">Acá todavía no hay nada</p>
              <p className="text-xs text-manso-black/55">Escribí el primer mensaje.</p>
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
                  <div className="my-3 flex justify-center">
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-manso-black/60 shadow-sm ring-1 ring-black/5">
                      {etiquetaDia(m.created_at)}
                    </span>
                  </div>
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

          {escribiendo.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-manso-black/60" aria-live="polite">
              <span className="flex gap-1 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-black/5">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-manso-black/40"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </span>
              {escribiendo.join(', ')} {escribiendo.length > 1 ? 'están escribiendo' : 'está escribiendo'}
            </div>
          )}
        </div>

        {!pegado && (
          <button
            onClick={irAbajo}
            className="absolute bottom-3 right-4 flex items-center gap-1.5 rounded-full bg-manso-black px-3.5 py-2 text-xs font-bold text-manso-cream shadow-lg transition hover:scale-105"
            aria-label="Ir al último mensaje"
          >
            <ArrowDown size={14} />
            {nuevos > 0 ? `${nuevos} nuevo${nuevos > 1 ? 's' : ''}` : 'Ir al final'}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="border-t border-red-200 bg-red-50 px-4 py-1.5 text-xs text-red-700">
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
