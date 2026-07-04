import Link from 'next/link'
import type { ForoCategoria } from '@/lib/types/foro'

type ThreadPreview = {
  id: string
  titulo: string
  autor_id: string
  autor_nombre: string | null
  autor_avatar: string | null
  views: number
  reply_count: number
  pinned: boolean
  cerrado: boolean
  updated_at: string
  categoria: Pick<ForoCategoria, 'nombre' | 'slug'> | null
}

type Props = { thread: ThreadPreview }

function formatFecha(iso: string) {
  const d = new Date(iso)
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `hace ${diffH} ${diffH === 1 ? 'hora' : 'horas'}`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `hace ${diffD} ${diffD === 1 ? 'día' : 'días'}`

  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })
}

export default function ThreadCard({ thread }: Props) {
  return (
    <div className="relative group py-4 hover:bg-manso-cream/[0.02] transition-colors px-2 -mx-2">
      {/* Link "estirado" a toda la tarjeta; el link al perfil del autor,
          al tener pointer-events propio, queda por encima y se puede clickear. */}
      <Link href={`/foro/${thread.id}`} className="absolute inset-0 z-0" aria-label={thread.titulo} />

      <div className="relative z-10 flex items-start gap-3 pointer-events-none">
        {/* Avatar */}
        <div className="shrink-0 w-11 h-11 rounded-full overflow-hidden ring-2 ring-manso-cream/15 mt-0.5">
          {thread.autor_avatar ? (
            <img
              src={thread.autor_avatar}
              alt={thread.autor_nombre ?? 'Usuario'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-manso-blue flex items-center justify-center text-manso-cream text-sm font-bold">
              {(thread.autor_nombre?.trim() || '?')[0].toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {thread.categoria && (
              <span className="text-[10px] font-bold tracking-widest uppercase text-manso-terra bg-manso-terra/10 rounded px-2 py-0.5">
                {thread.categoria.nombre}
              </span>
            )}
            {thread.pinned && (
              <span className="text-[10px] font-semibold tracking-wider uppercase text-manso-olive border border-manso-olive/40 px-1.5 py-0.5">
                Fijado
              </span>
            )}
            {thread.cerrado && (
              <span className="text-[10px] font-semibold tracking-wider uppercase text-manso-cream/30 border border-manso-cream/20 px-1.5 py-0.5">
                Cerrado
              </span>
            )}
          </div>

          <h2 className="text-manso-cream font-semibold text-lg md:text-xl leading-snug group-hover:text-manso-cream/80 transition-colors truncate">
            {thread.titulo}
          </h2>

          <div className="flex items-center gap-3 mt-1.5 text-manso-cream/35 text-sm">
            <Link
              href={`/usuario/${thread.autor_id}`}
              className="pointer-events-auto relative z-20 hover:text-manso-cream/70 hover:underline transition-colors"
            >
              {thread.autor_nombre ?? 'Anónimo'}
            </Link>
            <span>·</span>
            <span>{formatFecha(thread.updated_at)}</span>
            <span>·</span>
            <span>{thread.reply_count} {thread.reply_count === 1 ? 'respuesta' : 'respuestas'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
