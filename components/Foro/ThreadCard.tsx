import Link from 'next/link'
import type { ForoCategoria } from '@/lib/types/foro'

type ThreadPreview = {
  id: string
  titulo: string
  autor_nombre: string | null
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
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ThreadCard({ thread }: Props) {
  return (
    <Link href={`/foro/${thread.id}`} className="block group py-4 hover:bg-manso-cream/[0.02] transition-colors px-2 -mx-2">
      <div className="flex items-start gap-3">
        {/* Avatar inicial */}
        <div className="shrink-0 w-8 h-8 rounded-full bg-manso-blue flex items-center justify-center text-manso-cream text-xs font-bold mt-0.5">
          {(thread.autor_nombre?.trim() || '?')[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
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
            {thread.categoria && (
              <span className="text-[10px] font-semibold tracking-wider uppercase text-manso-terra">
                {thread.categoria.nombre}
              </span>
            )}
          </div>

          <h2 className="text-manso-cream font-semibold text-sm md:text-base leading-snug group-hover:text-manso-cream/80 transition-colors truncate">
            {thread.titulo}
          </h2>

          <div className="flex items-center gap-3 mt-1.5 text-manso-cream/35 text-xs">
            <span>{thread.autor_nombre ?? 'Anónimo'}</span>
            <span>·</span>
            <span>{formatFecha(thread.updated_at)}</span>
            <span>·</span>
            <span>{thread.reply_count} {thread.reply_count === 1 ? 'respuesta' : 'respuestas'}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
