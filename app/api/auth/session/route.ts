import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Obtener sesión del servidor (donde sí existe)
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Error en API session:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('📡 API Session - Sesión encontrada:', !!session);
    
    return NextResponse.json({ 
      session: session ? {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user: session.user
      } : null 
    });

  } catch (err) {
    console.error('❌ Error en API session:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
