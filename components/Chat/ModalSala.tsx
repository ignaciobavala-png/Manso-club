'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { KeyRound, Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export type ModoModal = 'crear' | 'clave'

interface Props {
  modo: ModoModal
  onCambiarModo: (m: ModoModal) => void
  onCerrar: () => void
  /** Sala creada o a la que se entró: ir a ella */
  onListo: (salaId: string) => void
}

/** Un solo diálogo con dos pestañas: crear una sala pública o entrar a una privada con su clave. */
export default function ModalSala({ modo, onCambiarModo, onCerrar, onListo }: Props) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const primerCampo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    primerCampo.current?.focus()
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [modo, onCerrar])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (ocupado) return
    setOcupado(true)
    setError('')

    if (modo === 'crear') {
      const { data, error: err } = await supabase.rpc('chat_crear_sala', {
        p_nombre: nombre,
        p_descripcion: descripcion || null,
      })
      if (err || !data) setError(err?.message ?? 'No se pudo crear la sala')
      else onListo(data as string)
    } else {
      const { data, error: err } = await supabase.rpc('chat_entrar_con_clave', { p_clave: clave })
      const r = data as { ok: boolean; error?: string; sala_id?: string } | null
      if (err || !r?.ok || !r.sala_id) setError(r?.error ?? err?.message ?? 'No se pudo entrar')
      else onListo(r.sala_id)
    }
    setOcupado(false)
  }

  const pestana = (id: ModoModal, texto: string, icono: React.ReactNode) => (
    <button
      type="button"
      onClick={() => {
        setError('')
        onCambiarModo(id)
      }}
      className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-bold uppercase tracking-wider transition ${
        modo === id ? 'bg-manso-cream text-manso-black' : 'text-manso-cream/60 hover:text-manso-cream'
      }`}
    >
      {icono}
      {texto}
    </button>
  )

  const campo =
    'w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-manso-cream ring-1 ring-white/15 placeholder:text-manso-cream/40 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-manso-terra'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 backdrop-blur-md sm:items-center"
      onMouseDown={e => e.target === e.currentTarget && onCerrar()}
      role="dialog"
      aria-modal="true"
      aria-label={modo === 'crear' ? 'Crear sala' : 'Entrar con clave'}
    >
      <motion.form
        onSubmit={enviar}
        initial={{ opacity: 0, y: 40, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="w-full max-w-md rounded-3xl bg-white/[0.08] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.18)] ring-1 ring-white/20 backdrop-blur-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex w-full max-w-[18rem] gap-1 rounded-full bg-white/10 p-1">
            {pestana('crear', 'Nueva sala', <Plus size={14} />)}
            {pestana('clave', 'Tengo clave', <KeyRound size={14} />)}
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded-full p-2 text-manso-cream/60 hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        <AnimatePresence mode="wait" initial={false}>
        {modo === 'crear' ? (
          <motion.div key="crear" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.15 }} className="space-y-3">
            <p className="text-xs text-manso-cream/60">
              Una sala pública la puede ver y usar cualquier persona de Manso. Para una sala privada con clave, pedísela al equipo.
            </p>
            <input
              ref={primerCampo}
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              maxLength={40}
              required
              placeholder="Nombre de la sala"
              className={campo}
            />
            <input
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              maxLength={120}
              placeholder="¿De qué se habla? (opcional)"
              className={campo}
            />
          </motion.div>
        ) : (
          <motion.div key="clave" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }} className="space-y-3">
            <p className="text-xs text-manso-cream/60">Pegá la clave que te pasaron para sumarte a una sala privada.</p>
            <input
              ref={primerCampo}
              value={clave}
              onChange={e => setClave(e.target.value)}
              required
              autoComplete="off"
              spellCheck={false}
              placeholder="CLAVE DE LA SALA"
              className={`${campo} font-mono uppercase tracking-widest`}
            />
          </motion.div>
        )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.p
              key={error}
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto', x: [0, -8, 8, -6, 6, 0] }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ x: { duration: 0.4 } }}
              className="mt-3 overflow-hidden rounded-xl bg-red-500/15 px-3 py-2 text-xs text-red-200"
            >
              {error.replace(/^.*?:\s*/, '')}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={ocupado}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="mt-4 w-full rounded-full bg-gradient-to-r from-manso-terra to-[#8f1d0f] px-4 py-3 text-xs font-black uppercase tracking-widest text-manso-cream shadow-[0_8px_20px_rgba(188,41,21,0.35)] disabled:opacity-50"
        >
          {ocupado ? 'Un segundo…' : modo === 'crear' ? 'Crear sala' : 'Entrar'}
        </motion.button>
      </motion.form>
    </motion.div>
  )
}
