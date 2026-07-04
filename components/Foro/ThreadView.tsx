import Link from 'next/link'
import type { ForoThread, ForoReply, ForoCategoria, ForoReaccion } from '@/lib/types/foro'
import ReplyForm from './ReplyForm'
import ReactionBar from './ReactionBar'
import ReportButton from './ReportButton'
import { ReaderProvider } from './Reader/ReaderProvider'
import { ReaderText } from './Reader/ReaderText'
import { ReaderButton } from './Reader/ReaderButton'

type Props = {
  thread: ForoThread & { categoria: Pick<ForoCategoria, 'nombre' | 'slug'> | null }
  replies: ForoReply[]
  reacciones: ForoReaccion[]
  currentUserId: string | null
  puedeComentar: boolean
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
    timeZone: 'America/Argentina/Buenos_Aires',
  })
}

function Avatar({ nombre, avatarUrl, size = 'md' }: { nombre: string | null; avatarUrl: string | null; size?: 'md' | 'lg' }) {
  const dimensions = size === 'lg' ? 'w-16 h-16' : 'w-12 h-12'
  const textSize = size === 'lg' ? 'text-lg' : 'text-base'
  return (
    <div className={`shrink-0 ${dimensions} rounded-full overflow-hidden ring-2 ring-manso-cream/15`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={nombre ?? 'Usuario'}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className={`w-full h-full bg-manso-blue flex items-center justify-center text-manso-cream ${textSize} font-bold`}>
          {(nombre?.trim() || '?')[0].toUpperCase()}
        </div>
      )}
    </div>
  )
}

export default function ThreadView({ thread, replies, reacciones, currentUserId, puedeComentar, estaLogueado, estaBaneado }: Props) {
  const path = `/foro/${thread.id}`

  const threadReacciones = reacciones.filter(r => r.thread_id === thread.id)

  return (
    <ReaderProvider>
      <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-manso-cream/30 mb-8">
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

        <div className="flex items-start justify-between gap-4 mb-6">
          <h1 className="text-manso-cream font-bold text-2xl md:text-3xl leading-tight">
            {thread.titulo}
          </h1>
          <ReaderButton />
        </div>

        <div className="flex items-start gap-4">
          <Avatar nombre={thread.autor_nombre} avatarUrl={thread.autor_avatar} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-manso-cream text-lg font-semibold">{thread.autor_nombre ?? 'Anónimo'}</span>
              <span className="text-manso-cream/30 text-xs">{formatFecha(thread.created_at)}</span>
            </div>
            <div className="border-l-2 border-manso-cream/10 pl-4">
              <ReaderText text={thread.cuerpo} variant="post" />
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

        <div className="mt-4 text-manso-cream/20 text-xs flex gap-4 pl-20">
          {currentUserId === thread.autor_id && (
            <span title="Solo vos ves las vistas de tu publicación">{thread.views} vistas</span>
          )}
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
                <div key={reply.id} className="flex items-start gap-4">
                  <Avatar nombre={reply.autor_nombre} avatarUrl={reply.autor_avatar} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-manso-cream text-base font-semibold">{reply.autor_nombre ?? 'Anónimo'}</span>
                      <span className="text-manso-cream/30 text-xs">{formatFecha(reply.created_at)}</span>
                    </div>
                    <ReaderText text={reply.cuerpo} variant="reply" />
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
        ) : puedeComentar ? (
          <ReplyForm threadId={thread.id} />
        ) : estaBaneado ? (
          <p className="text-manso-cream/30 text-sm text-center py-4">
            Tu cuenta fue restringida para participar en el foro. Contactá a Ana si creés que es un error.
          </p>
        ) : estaLogueado ? (
          <p className="text-manso-cream/30 text-sm text-center py-4">
            Sumate a la red Manso para participar. Contactá a Ana.
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
    </ReaderProvider>
  )
}
