'use server';

import { createSupabaseServer } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export async function loginAction(prevState: { error: string } | null, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email y contraseña son requeridos' };
  }

  const supabase = await createSupabaseServer();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log('[LOGIN] signIn result:', { hasSession: !!data.session, error: error?.message });

  if (error) {
    console.log('[LOGIN] Error:', error.message);
    return { error: error.message };
  }

  if (!data.session) {
    console.log('[LOGIN] No session created');
    return { error: 'No se pudo crear la sesión' };
  }

  // Verificar que las cookies se setearon
  console.log('[LOGIN] Redirecting to /mansoadm...');

  redirect('/mansoadm');
}
