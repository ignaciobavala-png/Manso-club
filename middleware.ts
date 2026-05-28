import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // silently fail
  }

  const pathname = request.nextUrl.pathname
  const isAdminLoginRoute = pathname === '/mansoadm/login'
  const isAdminRoute = pathname.startsWith('/mansoadm')
  const isLoginRoute = pathname === '/login'
  const isRegistroRoute = pathname === '/registro'
  const isMiCuentaRoute = pathname.startsWith('/mi-cuenta')
  const isStreamingRoute = pathname.startsWith('/streaming')
  const forceLogin = request.nextUrl.searchParams.get('force') === 'true'

  const getUserRole = async (userId: string): Promise<string | null> => {
    const { data } = await supabase.rpc('get_user_role', { user_id: userId })
    return data as string | null
  }

  // /login: si ya está logueado, redirigir según rol
  if (isLoginRoute && user && !forceLogin) {
    const role = await getUserRole(user.id)
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/mansoadm', request.url))
    }
    return NextResponse.redirect(new URL('/mi-cuenta', request.url))
  }

  // /registro: si ya está logueado, redirigir a mi-cuenta
  if (isRegistroRoute && user && !forceLogin) {
    return NextResponse.redirect(new URL('/mi-cuenta', request.url))
  }

  // /mi-cuenta y /streaming: requiere usuario autenticado
  if ((isMiCuentaRoute || isStreamingRoute) && !user) {
    const from = encodeURIComponent(pathname)
    return NextResponse.redirect(new URL(`/login?from=${from}`, request.url))
  }

  // /mansoadm/*: requiere usuario autenticado con rol admin
  if (isAdminRoute && !isAdminLoginRoute) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const role = await getUserRole(user.id)
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/mi-cuenta', request.url))
    }
  }

  // /mansoadm/login legacy: redirigir a /login
  if (isAdminLoginRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/mansoadm/:path*',
    '/login',
    '/registro',
    '/mi-cuenta/:path*',
    '/mi-cuenta',
    '/streaming/:path*',
    '/streaming',
  ],
}
