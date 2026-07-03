'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

// Ritmo de lectura: cuántas palabras por minuto avanza el cursor. El cursor
// resalta una palabra a la vez, en el orden real del texto (izquierda a
// derecha, arriba a abajo), imitando cómo se mueve el ojo al leer — no una
// franja espacial que agarra todo lo que esté cerca del centro a la vez.
const WORDS_PER_MINUTE = 170
const MS_PER_WORD = 60000 / WORDS_PER_MINUTE

// Suavizado del scroll: qué tan rápido "alcanza" a la palabra activa. Más
// alto = más pegado al cursor, más bajo = glide más relajado.
const SCROLL_EASE_RATE = 4

// El ojo no lee una palabra sola y salta a la siguiente: capta varias a la
// vez. En vez de un simple on/off por palabra, dejamos una "estela" de las
// últimas N palabras con brillo decreciente, para dar sensación de avance
// continuo en vez de un parpadeo palabra por palabra.
const TRAIL_LENGTH = 5

type ReaderContextValue = {
  isEnabled: boolean
  isPlaying: boolean
  play: () => void
  pause: () => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

const ReaderContext = createContext<ReaderContextValue | null>(null)

export function useReader() {
  const ctx = useContext(ReaderContext)
  if (!ctx) throw new Error('useReader debe usarse dentro de ReaderProvider')
  return ctx
}

export function ReaderProvider({ children }: { children: React.ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const rafIdRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef<number | null>(null)
  const prevScrollBehaviorRef = useRef<string>('')

  const wordsRef = useRef<HTMLElement[]>([])
  const activeIndexRef = useRef(-1)
  const wordTimerMsRef = useRef(0)

  // Scroll suavizado hacia la palabra activa (en vez de una velocidad
  // constante independiente, que era lo que producía el desfasaje entre
  // "dónde mira el ojo" y "qué se resalta").
  const currentScrollYRef = useRef(0)
  const targetScrollYRef = useRef(0)

  // Últimas palabras activadas, más reciente primero — define la estela.
  const trailRef = useRef<HTMLElement[]>([])

  const advanceTrail = useCallback((index: number) => {
    const el = wordsRef.current[index]
    if (!el) return

    trailRef.current.unshift(el)
    if (trailRef.current.length > TRAIL_LENGTH) {
      const stale = trailRef.current.pop()
      if (stale) delete stale.dataset.trail
    }
    trailRef.current.forEach((wordEl, i) => {
      wordEl.dataset.trail = String(i)
    })

    const rect = el.getBoundingClientRect()
    targetScrollYRef.current = rect.top + window.scrollY - window.innerHeight * 0.5
  }, [])

  const resetTrail = useCallback(() => {
    for (const el of trailRef.current) delete el.dataset.trail
    trailRef.current = []
  }, [])

  const stopLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    lastFrameTimeRef.current = null
  }, [])

  const tick = useCallback((timestamp: number) => {
    if (lastFrameTimeRef.current === null) {
      lastFrameTimeRef.current = timestamp
    }
    const dt = (timestamp - lastFrameTimeRef.current) / 1000
    lastFrameTimeRef.current = timestamp

    wordTimerMsRef.current += dt * 1000
    while (wordTimerMsRef.current >= MS_PER_WORD && activeIndexRef.current < wordsRef.current.length - 1) {
      wordTimerMsRef.current -= MS_PER_WORD
      activeIndexRef.current += 1
      advanceTrail(activeIndexRef.current)
    }

    // Fin del contenido: se terminó de mostrar la última palabra.
    if (
      activeIndexRef.current >= wordsRef.current.length - 1 &&
      wordTimerMsRef.current >= MS_PER_WORD
    ) {
      setIsPlaying(false)
      return
    }

    const ease = 1 - Math.exp(-SCROLL_EASE_RATE * dt)
    currentScrollYRef.current += (targetScrollYRef.current - currentScrollYRef.current) * ease
    window.scrollTo({ top: currentScrollYRef.current })

    rafIdRef.current = requestAnimationFrame(tick)
  }, [advanceTrail])

  const handleManualInteraction = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const detachManualListeners = useCallback(() => {
    window.removeEventListener('wheel', handleManualInteraction)
    window.removeEventListener('touchstart', handleManualInteraction)
    window.removeEventListener('keydown', handleManualInteraction)
  }, [handleManualInteraction])

  const play = useCallback(() => {
    setIsEnabled(true)
    setIsPlaying(true)
  }, [])

  const pause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  // Sincroniza el loop rAF y los listeners de scroll manual con isPlaying.
  // Corre después del commit de React, así que si esta es la primera vez
  // que se activa el reader (isEnabled pasa a true en el mismo click), los
  // <span class="reader-word"> ya están en el DOM cuando este efecto lee.
  useEffect(() => {
    if (isPlaying) {
      prevScrollBehaviorRef.current = document.documentElement.style.scrollBehavior
      document.documentElement.style.scrollBehavior = 'auto'

      wordsRef.current = containerRef.current
        ? Array.from(containerRef.current.querySelectorAll<HTMLElement>('.reader-word'))
        : []

      currentScrollYRef.current = window.scrollY
      if (activeIndexRef.current >= 0 && activeIndexRef.current < wordsRef.current.length) {
        resetTrail()
        const start = Math.max(0, activeIndexRef.current - TRAIL_LENGTH + 1)
        for (let i = start; i <= activeIndexRef.current; i++) advanceTrail(i)
      } else {
        targetScrollYRef.current = window.scrollY
      }

      window.addEventListener('wheel', handleManualInteraction, { passive: true })
      window.addEventListener('touchstart', handleManualInteraction, { passive: true })
      window.addEventListener('keydown', handleManualInteraction)

      lastFrameTimeRef.current = null
      wordTimerMsRef.current = 0
      rafIdRef.current = requestAnimationFrame(tick)
    } else {
      stopLoop()
      detachManualListeners()
      document.documentElement.style.scrollBehavior = prevScrollBehaviorRef.current || ''
    }

    return () => {
      stopLoop()
      detachManualListeners()
    }
  }, [isPlaying, tick, stopLoop, handleManualInteraction, detachManualListeners, advanceTrail, resetTrail])

  // Cleanup total al desmontar (cambio de página, etc.)
  useEffect(() => {
    return () => {
      document.documentElement.style.scrollBehavior = prevScrollBehaviorRef.current || ''
    }
  }, [])

  return (
    <ReaderContext.Provider value={{ isEnabled, isPlaying, play, pause, containerRef }}>
      <div ref={containerRef}>{children}</div>
    </ReaderContext.Provider>
  )
}
