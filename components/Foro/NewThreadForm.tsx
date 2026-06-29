'use client'

import { useState, useTransition } from 'react'
import { crearThread } from '@/app/foro/actions'
import type { ForoCategoria } from '@/lib/types/foro'

type Props = {
  categorias: Pick<ForoCategoria, 'id' | 'nombre' | 'slug'>[]
}

export default function NewThreadForm({ categorias }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await crearThread(formData)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al crear el thread')
      }
    })
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      {/* Categoría */}
      <div>
        <label className="block text-manso-cream/50 text-xs uppercase tracking-widest mb-2">
          Categoría
        </label>
        <select
          name="categoria_id"
          className="w-full bg-manso-cream/5 border border-manso-cream/15 text-manso-cream text-sm px-4 py-3 focus:outline-none focus:border-manso-cream/40 transition-colors"
        >
          <option value="">Sin categoría</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Título */}
      <div>
        <label className="block text-manso-cream/50 text-xs uppercase tracking-widest mb-2">
          Título
        </label>
        <input
          name="titulo"
          type="text"
          required
          maxLength={200}
          placeholder="¿De qué trata tu thread?"
          className="w-full bg-manso-cream/5 border border-manso-cream/15 text-manso-cream text-sm placeholder:text-manso-cream/25 px-4 py-3 focus:outline-none focus:border-manso-cream/40 transition-colors"
        />
      </div>

      {/* Cuerpo */}
      <div>
        <label className="block text-manso-cream/50 text-xs uppercase tracking-widest mb-2">
          Mensaje
        </label>
        <textarea
          name="cuerpo"
          rows={8}
          required
          placeholder="Escribí tu mensaje..."
          className="w-full bg-manso-cream/5 border border-manso-cream/15 text-manso-cream text-sm placeholder:text-manso-cream/25 px-4 py-3 resize-none focus:outline-none focus:border-manso-cream/40 transition-colors"
        />
      </div>

      {error && (
        <p className="text-manso-terra text-sm">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <a
          href="/foro"
          className="text-manso-cream/40 text-sm px-5 py-2.5 hover:text-manso-cream/70 transition-colors"
        >
          Cancelar
        </a>
        <button
          type="submit"
          disabled={pending}
          className="bg-manso-terra text-manso-cream text-sm font-semibold px-6 py-2.5 hover:bg-manso-terra/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Publicando...' : 'Publicar thread'}
        </button>
      </div>
    </form>
  )
}
