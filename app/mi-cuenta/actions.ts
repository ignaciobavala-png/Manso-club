'use server';

import { createSupabaseServer } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export type UpdateProfileState = { error?: string; success?: boolean } | null;

export async function updateProfileAction(
  prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const displayName = (formData.get('display_name') as string)?.trim();
  const telefono    = (formData.get('telefono') as string)?.trim();

  if (!displayName) return { error: 'El nombre no puede estar vacío' };

  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase
    .from('user_profiles')
    .update({ display_name: displayName, telefono: telefono || null, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) return { error: 'No se pudieron guardar los cambios' };

  revalidatePath('/mi-cuenta');
  return { success: true };
}
