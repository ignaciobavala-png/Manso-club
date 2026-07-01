import Link from 'next/link'
import type { ForoThread, ForoReply, ForoCategoria, ForoReaccion } from '@/lib/types/foro'
import ReplyForm from './ReplyForm'
import ReactionBar from './ReactionBar'
import ReportButton from './ReportButton'

type Props = {
  thread: ForoThread & { categoria: Pick<ForoCategoria, 'nombre' | 'slug'> | null }
  replies: ForoReply[]
  reacciones: ForoReaccion[]
  currentUserId: string | null
  puedeEscribir: boolean
  estaLogueado: boolean
  estaBaneado: boolean
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Avatar({ nombre }: { nombre: string | null }) {
  return (
    <div className="shrink-0 w-9 h-9 rounded-full bg-manso-blue flex items-center justify-center text-manso-cream text-sm font-bold">
      {(nombre?.trim() || '?')[0].toUpperCase()}
    </div>
  )
}

export default function ThreadView({ thread, replies, reacciones, currentUserId, puedeEscribir, estaLogueado, estaBaneado }: Props) {
  const path = `/foro/${thread.id}`

  const threadReacciones = reacciones.filter(r => r.thread_id === thread.id)

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-manso-cream/30 mb-8">
        <Link href="/foro" className="hover:text-manso-cream/60 transition-colors">Comunidad Manso</Link>
        <span>/</span>
        {thread.categoria && (
          <>
            <Link href={`/foro?categoria=${thread.categoria.slug}`} className="hover:text-manso-cream/60 transition-colors">
              {thread.categoria.nombre}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-manso-cream/50 truncate max-w-[200px]">{thread.titulo}</span>
      </div>

      {/* Thread principal */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {thread.categoria && (
            <span className="text-[10px] font-semibold tracking-wider uppercase text-manso-terra">
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

        <h1 className="text-manso-cream font-bold text-2xl md:text-3xl leading-tight mb-6">
          {thread.titulo}
        </h1>

        <div className="flex items-start gap-3">
          <Avatar nombre={thread.autor_nombre} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-manso-cream text-sm font-semibold">{thread.autor_nombre ?? 'Anónimo'}</span>
              <span className="text-manso-cream/30 text-xs">{formatFecha(thread.created_at)}</span>
            </div>
            <div className="text-manso-cream/80 text-sm leading-relaxed whitespace-pre-wrap border-l-2 border-manso-cream/10 pl-4">
              {thread.cuerpo}
            </div>
            <div className="pl-4">
              <ReactionBar
                reactions={threadReacciones}
                currentUserId={currentUserId}
                threadId={thread.id}
                path={path}
              />
              {estaLogueado && <ReportButton threadId={thread.id} />}
            </div>
          </div>
        </div>

        <div className="mt-4 text-manso-cream/20 text-xs flex gap-4 pl-12">
          <span>{thread.views} vistas</span>
          <span>{thread.reply_count} respuestas</span>
        </div>
      </div>

      {/* Respuestas */}
      {replies.length > 0 && (
        <div className="border-t border-manso-cream/10 pt-8 mb-8">
          <p className="text-manso-cream/30 text-xs uppercase tracking-widest mb-6">
            {replies.length} {replies.length === 1 ? 'respuesta' : 'respuestas'}
          </p>
          <div className="flex flex-col gap-6">
            {replies.map((reply) => {
              const replyReacciones = reacciones.filter(r => r.reply_id === reply.id)
              return (
                <div key={reply.id} className="flex items-start gap-3">
                  <Avatar nombre={reply.autor_nombre} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-manso-cream text-sm font-semibold">{reply.autor_nombre ?? 'Anónimo'}</span>
                      <span className="text-manso-cream/30 text-xs">{formatFecha(reply.created_at)}</span>
                    </div>
                    <div className="text-manso-cream/75 text-sm leading-relaxed whitespace-pre-wrap">
                      {reply.cuerpo}
                    </div>
                    <ReactionBar
                      reactions={replyReacciones}
                      currentUserId={currentUserId}
                      replyId={reply.id}
                      path={path}
                    />
                    {estaLogueado && <ReportButton replyId={reply.id} />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Form de respuesta */}
      <div className="border-t border-manso-cream/10 pt-8">
        {thread.cerrado ? (
          <p className="text-manso-cream/30 text-sm text-center py-4">
            Este thread está cerrado. No se pueden agregar más respuestas.
          </p>
        ) : puedeEscribir ? (
          <ReplyForm threadId={thread.id} />
        ) : estaBaneado ? (
          <p className="text-manso-cream/30 text-sm text-center py-4">
            Tu cuenta fue restringida para participar en el foro. Contactá a Ana si creés que es un error.
          </p>
        ) : estaLogueado ? (
          <p className="text-manso-cream/30 text-sm text-center py-4">
            Tu cuenta aún no tiene acceso para participar. Contactá a Ana.
          </p>
        ) : (
          <p className="text-manso-cream/30 text-sm text-center py-4">
            <Link href={`/login?from=/foro/${thread.id}`} className="underline hover:text-manso-cream/60 transition-colors">
              Iniciá sesión
            </Link>{' '}
            para responder.
          </p>
        )}
      </div>
    </div>
  )
}
