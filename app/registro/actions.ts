'use server';

import { createSupabaseServer } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export type RegistroState = {
  error?: string;
  confirmacion?: boolean;
} | null;

export async function registroAction(
  prevState: RegistroState,
  formData: FormData
): Promise<RegistroState> {
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const displayName = (formData.get('display_name') as string)?.trim();

  if (!email || !password || !displayName) {
    return { error: 'Todos los campos son requeridos' };
  }

  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres' };
  }

  const supabase = await createSupabaseServer();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });

  if (error) {
    return { error: 'No se pudo crear la cuenta. Intentá con otro email o contactá a soporte.' };
  }

  // Sin sesión → confirmación de email pendiente
  if (data.user && !data.session) {
    return { confirmacion: true };
  }

  redirect('/mi-cuenta');
}
