import Link from 'next/link'

type Props = {
  page: number
  totalPages: number
  categoria?: string
  q?: string
}

function buildHref(page: number, categoria?: string, q?: string) {
  const params = new URLSearchParams()
  if (categoria) params.set('categoria', categoria)
  if (q) params.set('q', q)
  if (page > 1) params.set('page', String(page))
  const qs = params.toString()
  return qs ? `/foro?${qs}` : '/foro'
}

export default function Pagination({ page, totalPages, categoria, q }: Props) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-4 mt-10 text-sm">
      {page > 1 ? (
        <Link href={buildHref(page - 1, categoria, q)} className="text-manso-cream/60 hover:text-manso-cream transition-colors">
          ← Anterior
        </Link>
      ) : (
        <span className="text-manso-cream/20">← Anterior</span>
      )}
      <span className="text-manso-cream/30 text-xs">
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={buildHref(page + 1, categoria, q)} className="text-manso-cream/60 hover:text-manso-cream transition-colors">
          Siguiente →
        </Link>
      ) : (
        <span className="text-manso-cream/20">Siguiente →</span>
      )}
    </div>
  )
}
