'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { unstable_rethrow } from 'next/navigation'
import { crearReply } from '@/app/foro/actions'

export default function ReplyForm({ threadId, estaLogueado }: { threadId: string; estaLogueado: boolean }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [cuerpo, setCuerpo] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()
  const draftKey = `foro_draft_${threadId}`

  // Restaura lo que el usuario escribió antes de que lo mandáramos a loguearse.
  useEffect(() => {
    const draft = localStorage.getItem(draftKey)
    if (draft) setCuerpo(draft)
  }, [draftKey])

  function handleSubmit(formData: FormData) {
    if (!estaLogueado) {
      localStorage.setItem(draftKey, cuerpo)
      router.push(`/login?from=/foro/${threadId}`)
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        await crearReply(threadId, formData)
        localStorage.removeItem(draftKey)
        setCuerpo('')
        formRef.current?.reset()
      } catch (e) {
        unstable_rethrow(e)
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
        value={cuerpo}
        onChange={(e) => setCuerpo(e.target.value)}
        placeholder="Escribí tu respuesta..."
        className="w-full bg-manso-cream/5 border border-manso-cream/15 text-manso-cream text-sm placeholder:text-manso-cream/25 px-4 py-3 resize-none focus:outline-none focus:border-manso-cream/40 transition-colors"
      />
      <p className="text-manso-cream/25 text-[11px] mt-1.5">
        Podés usar **negrita**, *cursiva* y pegar links directamente.
      </p>
      {!estaLogueado && (
        <p className="text-manso-cream/40 text-xs mt-2">
          Vas a necesitar iniciar sesión para publicarlo — tranquilo, no perdés lo que escribiste.
        </p>
      )}
      {error && (
        <p className="text-manso-terra text-xs mt-2">{error}</p>
      )}
      <div className="flex justify-end mt-3">
        <button
          type="submit"
          disabled={pending || !cuerpo.trim()}
          className="bg-manso-terra text-manso-cream text-sm font-semibold px-5 py-2.5 hover:bg-manso-terra/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Enviando...' : estaLogueado ? 'Responder' : 'Iniciá sesión para responder'}
        </button>
      </div>
    </form>
  )
}
