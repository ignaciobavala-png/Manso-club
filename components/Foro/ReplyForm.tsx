'use client'

import { useRef, useState, useTransition } from 'react'
import { crearReply } from '@/app/foro/actions'

export default function ReplyForm({ threadId }: { threadId: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await crearReply(threadId, formData)
        formRef.current?.reset()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al enviar la respuesta')
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit}>
      <p className="text-manso-cream/50 text-xs uppercase tracking-widest mb-3">Tu respuesta</p>
      <textarea
        name="cuerpo"
        rows={4}
        required
        placeholder="Escribí tu respuesta..."
        className="w-full bg-manso-cream/5 border border-manso-cream/15 text-manso-cream text-sm placeholder:text-manso-cream/25 px-4 py-3 resize-none focus:outline-none focus:border-manso-cream/40 transition-colors"
      />
      {error && (
        <p className="text-manso-terra text-xs mt-2">{error}</p>
      )}
      <div className="flex justify-end mt-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-manso-terra text-manso-cream text-sm font-semibold px-5 py-2.5 hover:bg-manso-terra/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Enviando...' : 'Responder'}
        </button>
      </div>
    </form>
  )
}
