'use server';

import { createSupabaseServer } from '@/lib/supabase';

export async function recuperarContrasenaAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const email = formData.get('email') as string;
  const origin = formData.get('origin') as string;

  if (!email) return { error: 'El email es requerido' };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/actualizar-contrasena`,
  });

  if (error) return { error: 'No se pudo enviar el email. Verificá que la dirección sea correcta.' };

  return { success: true };
}
