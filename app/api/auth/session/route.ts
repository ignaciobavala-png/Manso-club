import { createSupabaseServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServer();

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
    }

    // Solo devolver estado de autenticación y datos mínimos del usuario
    // NUNCA exponer access_token ni refresh_token
    return NextResponse.json({ 
      authenticated: !!session,
      user: session ? {
        id: session.user.id,
        email: session.user.email,
      } : null 
    });

  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
