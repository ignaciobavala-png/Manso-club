'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useChatInbox } from '@/hooks/useChatInbox'
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
    <div className="min-h-screen bg-manso-black px-0 pb-4 pt-20 sm:px-6 sm:pb-8 sm:pt-24">
      <div className="mx-auto flex h-[calc(100dvh-5.5rem)] max-w-6xl overflow-hidden bg-manso-cream shadow-[0_30px_80px_rgba(0,0,0,0.6)] ring-1 ring-manso-cream/25 sm:h-[calc(100dvh-8rem)] sm:rounded-3xl">
        <aside
          className={`${verConversacion ? 'hidden' : 'flex'} w-full flex-col bg-manso-blue md:flex md:w-80 md:shrink-0 lg:w-96`}
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
            <div className="m-auto flex flex-col items-center gap-3 px-6 text-center text-manso-black/50">
              <MessageCircle size={44} strokeWidth={1.5} />
              <p className="text-sm">{cargando ? 'Cargando…' : 'Elegí una conversación para empezar.'}</p>
            </div>
          )}
        </section>
      </div>

      {aviso && (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-manso-black px-5 py-2.5 text-xs font-semibold text-manso-cream shadow-xl ring-1 ring-manso-cream/20"
        >
          {aviso}
          <button onClick={() => setAviso('')} className="ml-3 underline">
            Cerrar
          </button>
        </div>
      )}

      {modal && <ModalSala modo={modal} onCambiarModo={setModal} onCerrar={() => setModal(null)} onListo={irA} />}
    </div>
  )
}
