'use server';

import { headers } from 'next/headers';
import { createSupabaseServer } from '@/lib/supabase';

export async function recuperarContrasenaAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const email = formData.get('email') as string;
  if (!email) return { error: 'El email es requerido' };

  const headersList = await headers();
  const host = headersList.get('host') ?? '';
  const proto = headersList.get('x-forwarded-proto') ?? 'https';
  const origin = `${proto}://${host}`;

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback`,
  });

  if (error) return { error: 'No se pudo enviar el email. Verificá que la dirección sea correcta.' };

  return { success: true };
}
