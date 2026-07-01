'use client'

import { useState, useTransition } from 'react'
import { reportarContenido } from '@/app/foro/actions'

type Props = {
  threadId?: string
  replyId?: string
}

export default function ReportButton({ threadId, replyId }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (enviado) {
    return <p className="mt-2 text-manso-cream/30 text-xs">Reporte enviado. Gracias, un admin lo va a revisar.</p>
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="mt-2 text-manso-cream/20 text-xs hover:text-manso-cream/50 transition-colors"
      >
        ⚑ Denunciar
      </button>
    )
  }

  return (
    <div className="mt-2 flex flex-col gap-2 max-w-sm">
      <textarea
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Contanos el motivo de la denuncia"
        rows={2}
        className="bg-manso-cream/5 border border-manso-cream/15 text-manso-cream text-xs px-3 py-2 focus:outline-none focus:border-manso-terra/50"
      />
      {error && <p className="text-manso-terra text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          disabled={isPending}
          onClick={() => {
            setError(null)
            startTransition(async () => {
              try {
                await reportarContenido({ threadId, replyId, motivo })
                setEnviado(true)
              } catch (err) {
                setError(err instanceof Error ? err.message : 'No se pudo enviar el reporte')
              }
            })
          }}
          className="text-xs font-semibold px-3 py-1.5 bg-manso-terra text-manso-cream hover:bg-manso-terra/80 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Enviando...' : 'Enviar denuncia'}
        </button>
        <button
          onClick={() => { setAbierto(false); setMotivo(''); setError(null) }}
          className="text-xs text-manso-cream/40 hover:text-manso-cream/70 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
