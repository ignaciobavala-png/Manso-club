'use client'

import { useReader } from './ReaderProvider'

type Props = {
  text: string
  variant: 'post' | 'reply'
}

const VARIANT_CLASSES: Record<Props['variant'], string> = {
  post: 'text-manso-cream/80 text-lg leading-relaxed whitespace-pre-wrap break-words',
  reply: 'text-manso-cream/75 text-base leading-relaxed whitespace-pre-wrap break-words',
}

// Separa en tokens preservando los espacios/saltos de línea como texto literal,
// para que el modo palabra por palabra se vea idéntico al render plano original.
function tokenize(text: string): string[] {
  return text.split(/(\s+)/)
}

// Formato lite: **negrita**, *cursiva* y autolink de URLs. Se resuelve solo al
// renderizar (el cuerpo se guarda siempre como texto plano en la DB).
const INLINE_REGEX = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(https?:\/\/[^\s]+)/g

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let i = 0
  let match: RegExpExecArray | null

  INLINE_REGEX.lastIndex = 0
  while ((match = INLINE_REGEX.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    if (match[1]) {
      nodes.push(<strong key={`${keyPrefix}-${i}`}>{match[2]}</strong>)
    } else if (match[3]) {
      nodes.push(<em key={`${keyPrefix}-${i}`}>{match[4]}</em>)
    } else if (match[5]) {
      let url = match[5]
      let trailing = ''
      const trailingMatch = url.match(/[.,!?)]+$/)
      if (trailingMatch) {
        trailing = trailingMatch[0]
        url = url.slice(0, -trailing.length)
      }
      nodes.push(
        <a
          key={`${keyPrefix}-${i}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="underline text-manso-terra hover:text-manso-terra/80 break-all"
        >
          {url}
        </a>
      )
      if (trailing) nodes.push(trailing)
    }

    lastIndex = INLINE_REGEX.lastIndex
    i++
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

export function ReaderText({ text, variant }: Props) {
  const { isEnabled } = useReader()
  const className = VARIANT_CLASSES[variant]

  if (!isEnabled) {
    return <div className={className}>{renderInline(text, 'p')}</div>
  }

  const tokens = tokenize(text)

  return (
    <div className={className}>
      {tokens.map((token, i) =>
        /^\s+$/.test(token) ? (
          <span key={i}>{token}</span>
        ) : (
          <span key={i} className="reader-word">
            {renderInline(token, `w-${i}`)}
          </span>
        )
      )}
    </div>
  )
}
