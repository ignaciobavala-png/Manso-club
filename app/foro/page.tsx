import Link from 'next/link'
import { createSupabaseAnon, createSupabaseServer } from '@/lib/supabase'
import { getForoPermisos } from '@/lib/foro/permisos'
import { ParticleBackground } from '@/components/Home/ParticleBackground'
import ThreadCard from '@/components/Foro/ThreadCard'
import Pagination from '@/components/Foro/Pagination'
import type { ForoCategoria } from '@/lib/types/foro'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Comunidad Manso | Manso Club',
}

const PAGE_SIZE = 20

// Arma un valor de filtro ILIKE que busca `value` como texto literal:
// 1) escapa los wildcards de ILIKE (\, %, _) para que no actúen como comodines
// 2) envuelve en comillas dobles y escapa \/" según la sintaxis de valores de PostgREST
function buildIlikeFilterValue(value: string) {
  const likeEscaped = value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
  const pattern = `%${likeEscaped}%`
  const quoted = pattern.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `"${quoted}"`
}

export default async function ForoPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string; page?: string }>
}) {
  const { categoria: categoriaSlug, q, page: pageParam } = await searchParams
  const busqueda = q?.trim() ?? ''
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const supabase = createSupabaseAnon()

  const { data: categorias } = await supabase
    .from('foro_categorias')
    .select('id, nombre, slug, descripcion, orden, activo')
    .eq('activo', true)
    .order('orden')

  const categoriaActiva = categoriaSlug
    ? (categorias ?? []).find((c: ForoCategoria) => c.slug === categoriaSlug)
    : null

  let threadsQuery = supabase
    .from('foro_threads')
    .select('id, titulo, categoria_id, autor_nombre, views, reply_count, pinned, cerrado, created_at, updated_at', { count: 'exact' })
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false })

  if (categoriaActiva) {
    threadsQuery = threadsQuery.eq('categoria_id', categoriaActiva.id)
  }

  if (busqueda) {
    const filterValue = buildIlikeFilterValue(busqueda)
    threadsQuery = threadsQuery.or(`titulo.ilike.${filterValue},cuerpo.ilike.${filterValue}`)
  }

  const { data: threads, count } = await threadsQuery.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))

  // Mapear categoria a cada thread para el ThreadCard
  const categoriaMap = Object.fromEntries(
    (categorias ?? []).map((c) => [c.id, c])
  )
  const threadsConCategoria = (threads ?? []).map((t) => ({
    ...t,
    categoria: t.categoria_id ? (categoriaMap[t.categoria_id] ?? null) : null,
  }))

  // Verificar permisos del usuario actual
  const supabaseAuth = await createSupabaseServer()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  const puedeEscribir = user ? (await getForoPermisos(supabaseAuth, user.id)).puedeEscribir : false

  return (
    <div
      className="relative min-h-screen bg-manso-black"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    >
      <ParticleBackground />
      <div className="relative z-10 max-w-[1000px] mx-auto px-4 md:px-8 pt-32 pb-20">

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-manso-terra text-xs tracking-[0.2em] uppercase mb-2">Comunidad</p>
            <h1 className="text-manso-cream font-bold text-4xl md:text-5xl tracking-tight">
              COMUNIDAD MANSO_
            </h1>
          </div>
          {puedeEscribir && (
            <Link
              href="/foro/nuevo"
              className="bg-manso-terra text-manso-cream text-sm font-semibold px-5 py-2.5 hover:bg-manso-terra/80 transition-colors"
            >
              + Nuevo Post
            </Link>
          )}
          {!puedeEscribir && user && (
            <p className="text-manso-cream/40 text-xs text-right max-w-[200px]">
              Tu cuenta aún no tiene acceso para participar
            </p>
          )}
          {!user && (
            <Link href="/login?from=/foro" className="text-manso-cream/50 text-sm hover:text-manso-cream transition-colors">
              Iniciá sesión para participar
            </Link>
          )}
        </div>

        {/* Búsqueda */}
        <form action="/foro" method="get" className="mb-6">
          {categoriaSlug && <input type="hidden" name="categoria" value={categoriaSlug} />}
          <input
            type="text"
            name="q"
            defaultValue={busqueda}
            placeholder="Buscar en el foro..."
            className="w-full bg-manso-cream/5 border border-manso-cream/15 text-manso-cream text-sm px-4 py-2.5 focus:outline-none focus:border-manso-terra/50 placeholder:text-manso-cream/30"
          />
        </form>

        {/* Filtro categorías */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/foro"
            className={`px-4 py-1.5 text-xs font-semibold tracking-wider uppercase transition-colors ${
              !categoriaSlug
                ? 'bg-manso-cream text-manso-black'
                : 'border border-manso-cream/20 text-manso-cream/60 hover:text-manso-cream hover:border-manso-cream/50'
            }`}
          >
            Todos
          </Link>
          {(categorias ?? []).map((cat: ForoCategoria) => (
            <Link
              key={cat.slug}
              href={`/foro?categoria=${cat.slug}`}
              className={`px-4 py-1.5 text-xs font-semibold tracking-wider uppercase transition-colors ${
                categoriaSlug === cat.slug
                  ? 'bg-manso-terra text-manso-cream'
                  : 'border border-manso-cream/20 text-manso-cream/60 hover:text-manso-cream hover:border-manso-cream/50'
              }`}
            >
              {cat.nombre}
            </Link>
          ))}
        </div>

        {/* Lista de threads */}
        {threadsConCategoria.length === 0 ? (
          <div className="text-center py-20 text-manso-cream/30 text-sm">
            {busqueda
              ? 'No encontramos threads que coincidan con tu búsqueda.'
              : categoriaSlug
                ? 'No hay threads en esta categoría todavía.'
                : 'El foro está vacío por ahora.'}
          </div>
        ) : (
          <>
            <div className="flex flex-col divide-y divide-manso-cream/10">
              {threadsConCategoria.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              categoria={categoriaSlug}
              q={busqueda}
            />
          </>
        )}
      </div>
    </div>
  )
}
