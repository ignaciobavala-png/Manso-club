'use server';

import { createSupabaseServer } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export async function loginAction(prevState: { error: string } | null, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const from = (formData.get('from') as string) || null;

  if (!email || !password) {
    return { error: 'Email y contraseña son requeridos' };
  }

  const supabase = await createSupabaseServer();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: 'Email o contraseña incorrectos' };
  }

  if (!data.session) {
    return { error: 'No se pudo crear la sesión' };
  }

  const { data: role } = await supabase.rpc('get_user_role', { user_id: data.user.id });

  if (role === 'admin') {
    redirect('/mansoadm');
  }

  // Redirigir a la página de origen si existe, sino a mi-cuenta
  const destination = from && from.startsWith('/') ? from : '/mi-cuenta';
  redirect(destination);
}
