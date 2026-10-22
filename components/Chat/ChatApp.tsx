'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useChatInbox } from '@/hooks/useChatInbox'
import { ParticleBackground } from '@/components/Home/ParticleBackground'
import Conversacion from './Conversacion'
import ModalSala, { type ModoModal } from './ModalSala'
import Sidebar from './Sidebar'

interface Props {
  userId: string
  userNombre: string
  baneado: boolean
  esAdmin: boolean
  /** Sala pedida por la URL (?sala=...), si hay */
  salaInicial: string | null
}

export default function ChatApp({ userId, userNombre, baneado, esAdmin, salaInicial }: Props) {
  const { conversaciones, noLeidos, enLinea, retencionGlobal, cargando, recargar, setActiva, marcarLeida } =
    useChatInbox(userId, userNombre)

  const [elegida, setElegida] = useState<string | null>(salaInicial)
  // en el celular se ve la lista o la conversación, no las dos
  const [verConversacion, setVerConversacion] = useState(salaInicial !== null)
  const [modal, setModal] = useState<ModoModal | null>(null)
  const [aviso, setAviso] = useState('')

  // Si no eligió nada (o la sala ya no existe), arranca en la general
  const salaId = useMemo(() => {
    if (elegida && conversaciones.some(c => c.sala.id === elegida)) return elegida
    return conversaciones[0]?.sala.id ?? null
  }, [elegida, conversaciones])

  const activa = conversaciones.find(c => c.sala.id === salaId) ?? null

  useEffect(() => {
    setActiva(salaId)
  }, [salaId, setActiva])

  // El aviso se va solo
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(''), 4500)
    return () => clearTimeout(t)
  }, [aviso])

  // El título de la pestaña avisa de lo que no se leyó
  const totalNoLeidos = Object.values(noLeidos).reduce((a, b) => a + b, 0)
  useEffect(() => {
    document.title = `${totalNoLeidos > 0 ? `(${totalNoLeidos}) ` : ''}Manso Chat`
    return () => {
      document.title = 'Chat | Manso Club'
    }
  }, [totalNoLeidos])

  const irA = useCallback(
    async (id: string) => {
      await recargar()
      setElegida(id)
      setVerConversacion(true)
      setModal(null)
    },
    [recargar],
  )

  const abrirDm = useCallback(
    async (otroId: string) => {
      const { data, error } = await supabase.rpc('chat_abrir_dm', { p_otro: otroId })
      if (error || !data) {
        setAviso('No se pudo abrir la conversación')
        return
      }
      await irA(data as string)
    },
    [irA],
  )

  const accion = useCallback(
    async (rpc: 'chat_salir' | 'chat_eliminar_sala') => {
      if (!salaId) return
      const { error } = await supabase.rpc(rpc, { p_sala: salaId })
      if (error) {
        setAviso(error.message)
        return
      }
      setElegida(null)
      setVerConversacion(false)
      await recargar()
    },
    [salaId, recargar],
  )

  const leer = useCallback(() => {
    if (salaId) marcarLeida(salaId)
  }, [salaId, marcarLeida])

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen overflow-hidden bg-black px-0 pb-4 pt-20 sm:px-6 sm:pb-8 sm:pt-24">
        {/* Puntos animados del sitio + luces de color detrás del vidrio, para que el desenfoque tenga qué mostrar */}
        <ParticleBackground opacity={0.55} radiusScale={1.2} />
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="chat-luz-a absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-manso-terra/25 blur-[120px]" />
          <div className="chat-luz-b absolute -right-20 top-10 h-[26rem] w-[26rem] rounded-full bg-manso-cream/10 blur-[120px]" />
          <div className="chat-luz-a absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-manso-olive/20 blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 140, damping: 18 }}
          className="relative mx-auto flex h-[calc(100dvh-5.5rem)] max-w-6xl overflow-hidden bg-white/[0.06] shadow-[0_30px_90px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.18)] ring-1 ring-white/20 backdrop-blur-2xl sm:h-[calc(100dvh-8rem)] sm:rounded-3xl"
        >
          <aside
            className={`${verConversacion ? 'hidden' : 'flex'} w-full flex-col border-r border-white/10 bg-black/35 md:flex md:w-80 md:shrink-0 lg:w-96`}
          >
            <Sidebar
              conversaciones={conversaciones}
              cargando={cargando}
              salaId={salaId}
              noLeidos={noLeidos}
              enLinea={enLinea}
              userId={userId}
              onElegir={id => {
                setElegida(id)
                setVerConversacion(true)
              }}
              onAbrirDm={abrirDm}
              onNuevaSala={() => setModal('crear')}
              onEntrarConClave={() => setModal('clave')}
            />
          </aside>

          <section className={`${verConversacion ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col md:flex`}>
            {activa ? (
              <Conversacion
                key={activa.sala.id}
                conv={activa}
                userId={userId}
                userNombre={userNombre}
                baneado={baneado}
                esAdmin={esAdmin}
                enLinea={enLinea}
                retencionDias={activa.sala.retencion_dias ?? retencionGlobal}
                onVolver={() => setVerConversacion(false)}
                onLeer={leer}
                onSalir={() => accion('chat_salir')}
                onEliminar={() => accion('chat_eliminar_sala')}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-manso-cream/50">
                <motion.span animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}>
                  <MessageCircle size={48} strokeWidth={1.5} />
                </motion.span>
                <p className="text-sm">{cargando ? 'Cargando…' : 'Elegí una conversación para empezar.'}</p>
              </div>
            )}
          </section>
        </motion.div>

        <AnimatePresence>
          {aviso && (
            <motion.div
              key="aviso"
              role="alert"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-manso-black px-5 py-2.5 text-xs font-semibold text-manso-cream shadow-xl ring-1 ring-manso-cream/20"
            >
              {aviso}
              <button onClick={() => setAviso('')} className="ml-3 underline">
                Cerrar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {modal && <ModalSala key="modal" modo={modal} onCambiarModo={setModal} onCerrar={() => setModal(null)} onListo={irA} />}
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}
