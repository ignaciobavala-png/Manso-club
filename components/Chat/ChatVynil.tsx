'use client'

import { useVynil } from '@/store/useVynil'
import { VynilDisco } from '@/components/Vynil/VynilDisco'

/**
 * El vinilo de la casa dentro del chat: muestra qué suena y abre el panel de
 * Vynil (el mismo reproductor global, con la playlist de la comunidad).
 */
export default function ChatVynil() {
  const temas = useVynil(s => s.temas)
  const indice = useVynil(s => s.indice)
  const sonando = useVynil(s => s.sonando)
  const cargado = useVynil(s => s.cargado)
  const actual = temas[indice]

  if (cargado && temas.length === 0) return null

  return (
    <button
      onClick={() => window.dispatchEvent(new Event('vynil:abrir'))}
      className="group flex w-full items-center gap-3 border-t border-manso-cream/10 px-4 py-3 text-left transition-colors hover:bg-manso-cream/5"
      aria-label="Abrir Vynil, la música de la comunidad"
    >
      <VynilDisco tema={actual} tamano={44} girando={sonando} className="transition-transform group-hover:scale-105" />
      <span className="min-w-0">
        <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-manso-olive">
          {sonando ? 'Suena ahora' : 'Vynil_'}
        </span>
        <span className="block truncate text-xs text-manso-cream/70">
          {actual?.titulo ?? 'La música de la comunidad'}
        </span>
      </span>
    </button>
  )
}
