'use client'

import { useEffect, useRef, useState } from 'react'
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
        modo === id ? 'bg-manso-black text-manso-cream' : 'text-manso-black/60 hover:text-manso-black'
      }`}
    >
      {icono}
      {texto}
    </button>
  )

  const campo =
    'w-full rounded-xl bg-manso-cream/60 px-4 py-3 text-sm text-manso-black ring-1 ring-black/10 placeholder:text-manso-black/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-manso-terra'

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={e => e.target === e.currentTarget && onCerrar()}
      role="dialog"
      aria-modal="true"
      aria-label={modo === 'crear' ? 'Crear sala' : 'Entrar con clave'}
    >
      <form onSubmit={enviar} className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex w-full max-w-[18rem] gap-1 rounded-full bg-manso-black/5 p-1">
            {pestana('crear', 'Nueva sala', <Plus size={14} />)}
            {pestana('clave', 'Tengo clave', <KeyRound size={14} />)}
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded-full p-2 text-manso-black/50 hover:bg-black/5">
            <X size={18} />
          </button>
        </div>

        {modo === 'crear' ? (
          <div className="space-y-3">
            <p className="text-xs text-manso-black/60">
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
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-manso-black/60">Pegá la clave que te pasaron para sumarte a una sala privada.</p>
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
          </div>
        )}

        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
            {error.replace(/^.*?:\s*/, '')}
          </p>
        )}

        <button
          type="submit"
          disabled={ocupado}
          className="mt-4 w-full rounded-full bg-manso-terra px-4 py-3 text-xs font-black uppercase tracking-widest text-manso-cream transition hover:bg-manso-terra/90 disabled:opacity-50"
        >
          {ocupado ? 'Un segundo…' : modo === 'crear' ? 'Crear sala' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
