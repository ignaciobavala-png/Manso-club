'use client'

import { Play, Pause } from 'lucide-react'
import { useReader } from './ReaderProvider'

export function ReaderButton() {
  const { isPlaying, play, pause } = useReader()

  return (
    <button
      onClick={() => (isPlaying ? pause() : play())}
      title={isPlaying ? 'Pausar lectura' : 'Iniciar lectura automática'}
      className="shrink-0 w-9 h-9 rounded-full border border-manso-cream/30 text-manso-cream/70 flex items-center justify-center hover:border-manso-cream hover:text-manso-cream transition-all active:scale-95"
    >
      {isPlaying ? (
        <Pause size={15} strokeWidth={1.5} />
      ) : (
        <Play size={15} strokeWidth={1.5} className="ml-0.5" />
      )}
    </button>
  )
}
