import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log('🔍 Middleware running for:', request.nextUrl.pathname);
  
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { 
          const cookies = request.cookies.getAll();
          console.log('🍪 All cookies:', cookies.map(c => ({ name: c.name })));
          return cookies;
        },
        setAll(cookiesToSet) {
          console.log('🍪 Setting cookies:', cookiesToSet.map(c => ({ name: c.name })));
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Usamos getUser() para validar la sesión en el servidor
  const { data: { user }, error } = await supabase.auth.getUser()
  
  console.log('👤 User from middleware:', user ? { id: user.id, email: user.email } : 'No user');
  if (error) {
    console.error('❌ Middleware auth error:', error);
  }

  const isLoginRoute = request.nextUrl.pathname === '/mansoadm/login'
  const isAdminRoute = request.nextUrl.pathname.startsWith('/mansoadm')
  const forceLogin = request.nextUrl.searchParams.get('force') === 'true'

  console.log('📍 Route analysis:', { isLoginRoute, isAdminRoute, forceLogin, pathname: request.nextUrl.pathname });

  if (isAdminRoute && !isLoginRoute && !user) {
    console.log('🔄 Redirecting to login - no user found');
    return NextResponse.redirect(new URL('/mansoadm/login', request.url))
  }

  // Solo redirigir al dashboard si está autenticado Y no está forzando el login
  if (isLoginRoute && user && !forceLogin) {
    console.log('✅ Redirecting to dashboard - user authenticated');
    return NextResponse.redirect(new URL('/mansoadm', request.url))
  }

  console.log('✅ Allowing request to proceed');
  return response
}

export const config = {
  matcher: ['/mansoadm/:path*'],
}