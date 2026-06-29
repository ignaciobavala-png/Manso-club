'use client'

import { useOptimistic, useTransition } from 'react'
import { toggleReaccion } from '@/app/foro/reacciones'

const EMOJIS = [
  { code: 'heart', emoji: '❤️' },
  { code: 'fire',  emoji: '🔥' },
  { code: 'clap',  emoji: '👏' },
]

type Reaccion = { emoji: string; autor_id: string }

type Props = {
  reactions: Reaccion[]
  currentUserId: string | null
  threadId?: string
  replyId?: string
  path: string
}

export default function ReactionBar({ reactions, currentUserId, threadId, replyId, path }: Props) {
  const [, startTransition] = useTransition()

  const [optimistic, updateOptimistic] = useOptimistic(
    reactions,
    (state: Reaccion[], { emoji, action }: { emoji: string; action: 'add' | 'remove' }) =>
      action === 'add'
        ? [...state, { emoji, autor_id: currentUserId! }]
        : state.filter(r => !(r.emoji === emoji && r.autor_id === currentUserId))
  )

  function handleToggle(code: string) {
    if (!currentUserId) return
    const hasReaction = optimistic.some(r => r.emoji === code && r.autor_id === currentUserId)
    updateOptimistic({ emoji: code, action: hasReaction ? 'remove' : 'add' })
    startTransition(() => {
      toggleReaccion({ emoji: code, threadId, replyId, path })
    })
  }

  const visibles = EMOJIS.filter(({ code }) => {
    const count = optimistic.filter(r => r.emoji === code).length
    const isOwn = optimistic.some(r => r.emoji === code && r.autor_id === currentUserId)
    return count > 0 || isOwn || !!currentUserId
  })

  if (visibles.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
      {EMOJIS.map(({ code, emoji }) => {
        const count = optimistic.filter(r => r.emoji === code).length
        const isActive = optimistic.some(r => r.emoji === code && r.autor_id === currentUserId)

        if (count === 0 && !currentUserId) return null

        return (
          <button
            key={code}
            onClick={() => handleToggle(code)}
            disabled={!currentUserId}
            title={currentUserId ? undefined : 'Iniciá sesión para reaccionar'}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-all ${
              isActive
                ? 'bg-manso-terra/20 border-manso-terra/50 text-manso-cream'
                : count > 0
                  ? 'bg-manso-cream/5 border-manso-cream/15 text-manso-cream/60 hover:border-manso-cream/35 hover:text-manso-cream'
                  : 'bg-transparent border-manso-cream/10 text-manso-cream/25 hover:border-manso-cream/25 hover:text-manso-cream/50'
            } ${currentUserId ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <span className="leading-none">{emoji}</span>
            {count > 0 && <span className="font-semibold tabular-nums">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}
