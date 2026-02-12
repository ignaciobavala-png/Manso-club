'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(prevState: { error: string } | null, formData: FormData) {
  console.log('🔐 Server Action: Starting login process');
  
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  console.log('📧 Email:', email);
  console.log('🔑 Password provided:', !!password);

  if (!email || !password) {
    console.log('❌ Missing credentials');
    return { error: 'Email y contraseña son requeridos' };
  }

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

  try {
    console.log('🔄 Attempting Supabase signIn...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('📊 Supabase response:', { data: !!data, error: error?.message });

    if (error) {
      console.error('❌ Login error:', error);
      return { error: error.message };
    }

    if (data.session) {
      console.log('✅ Login successful, session created');
      console.log('🍪 Session data:', {
        hasSession: !!data.session,
        userId: data.session.user?.id,
        email: data.session.user?.email,
        expiresAt: data.session.expires_at
      });
      
      // Redirigir directamente desde el server action
      redirect('/mansoadm');
    }

    console.log('❌ No session created');
    return { error: 'No se pudo crear la sesión' };
  } catch (err) {
    console.error('💥 Unexpected login error:', err);
    if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
      throw err; // Re-throw redirect errors
    }
    return { error: 'Error inesperado durante el login: ' + (err as Error).message };
  }
}
