'use client'

import { useReader } from './ReaderProvider'

type Props = {
  text: string
  variant: 'post' | 'reply'
}

const VARIANT_CLASSES: Record<Props['variant'], string> = {
  post: 'text-manso-cream/80 text-lg leading-relaxed whitespace-pre-wrap',
  reply: 'text-manso-cream/75 text-base leading-relaxed whitespace-pre-wrap',
}

// Separa en tokens preservando los espacios/saltos de línea como texto literal,
// para que el modo palabra por palabra se vea idéntico al render plano original.
function tokenize(text: string): string[] {
  return text.split(/(\s+)/)
}

export function ReaderText({ text, variant }: Props) {
  const { isEnabled } = useReader()
  const className = VARIANT_CLASSES[variant]

  if (!isEnabled) {
    return <div className={className}>{text}</div>
  }

  const tokens = tokenize(text)

  return (
    <div className={className}>
      {tokens.map((token, i) =>
        /^\s+$/.test(token) ? (
          <span key={i}>{token}</span>
        ) : (
          <span key={i} className="reader-word">
            {token}
          </span>
        )
      )}
    </div>
  )
}
