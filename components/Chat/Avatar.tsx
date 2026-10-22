import { colorAvatar } from '@/lib/chat-utils'

interface Props {
  id: string
  nombre: string | null
  url?: string | null
  tamano?: number
  /** Punto verde de "en línea" */
  enLinea?: boolean
}

/** Foto de perfil o inicial sobre un color de la paleta (siempre el mismo para la misma persona). */
export default function Avatar({ id, nombre, url, tamano = 36, enLinea }: Props) {
  const inicial = ((nombre ?? '?').trim()[0] ?? '?').toUpperCase()
  return (
    <span className="relative inline-block shrink-0" style={{ width: tamano, height: tamano }}>
      <span
        className={`flex h-full w-full items-center justify-center overflow-hidden rounded-full font-bold text-manso-cream ${colorAvatar(id)}`}
        style={{ fontSize: tamano * 0.42 }}
      >
        {url ? <img src={url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" /> : inicial}
      </span>
      {enLinea && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-manso-blue" />
        </span>
      )}
    </span>
  )
}
