'use client'

import { useState, useTransition } from 'react'
import { borrarThread, borrarReply } from '@/app/foro/actions'

type Props = {
  threadId?: string
  replyId?: string
}

export default function DeleteButton({ threadId, replyId }: Props) {
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const eliminar = () => {
    setError(null)
    startTransition(async () => {
      try {
        if (replyId && threadId) {
          await borrarReply(replyId, threadId)
        } else if (threadId) {
          await borrarThread(threadId)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo eliminar')
        setConfirmando(false)
      }
    })
  }

  if (confirmando) {
    return (
      <span className="mt-2 inline-flex items-center gap-2 text-xs">
        <span className="text-manso-cream/50">
          {replyId ? '¿Borrar esta respuesta?' : '¿Borrar esta publicación?'}
        </span>
        <button
          disabled={isPending}
          onClick={eliminar}
          className="font-semibold text-manso-terra hover:text-manso-terra/70 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Borrando...' : 'Sí, borrar'}
        </button>
        <button
          onClick={() => setConfirmando(false)}
          className="text-manso-cream/40 hover:text-manso-cream/70 transition-colors"
        >
          Cancelar
        </button>
      </span>
    )
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setConfirmando(true)}
        className="text-manso-cream/20 text-xs hover:text-manso-terra/70 transition-colors"
      >
        🗑 Borrar
      </button>
      {error && <p className="text-manso-terra text-xs mt-1">{error}</p>}
    </div>
  )
}
