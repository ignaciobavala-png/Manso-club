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
  const bio         = (formData.get('bio') as string)?.trim();
  const socialLinksRaw = formData.get('social_links') as string | null;

  if (!displayName) return { error: 'El nombre no puede estar vacío' };

  let socialLinks: { label: string; url: string }[] = [];
  if (socialLinksRaw) {
    try {
      socialLinks = JSON.parse(socialLinksRaw);
    } catch {
      socialLinks = [];
    }
  }

  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase
    .from('user_profiles')
    .update({
      display_name: displayName,
      telefono: telefono || null,
      bio: bio || null,
      social_links: socialLinks,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) return { error: 'No se pudieron guardar los cambios' };

  revalidatePath('/mi-cuenta');
  return { success: true };
}

export type SaveArtistaState = { error?: string; success?: boolean; artistaId?: string; slug?: string } | null;

export async function saveArtistaAction(
  _prev: SaveArtistaState,
  formData: FormData
): Promise<SaveArtistaState> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('permisos_totales')
    .eq('id', user.id)
    .single();

  if (!profile?.permisos_totales) return { error: 'Se requiere membresía activa' };

  const nombre = (formData.get('nombre') as string)?.trim();
  if (!nombre) return { error: 'El nombre es obligatorio' };

  const slug = nombre
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const linksRaw = formData.get('social_links') as string;
  const social_links = linksRaw ? JSON.parse(linksRaw) : [];

  const payload = {
    nombre,
    slug,
    bio: (formData.get('bio') as string) || null,
    estilo: (formData.get('estilo') as string) || null,
    tipo: (formData.get('tipo') as string) || 'DJ',
    imagen_url: (formData.get('imagen_url') as string) || null,
    soundcloud_url: (formData.get('soundcloud_url') as string) || null,
    social_links,
    active: true,
    user_id: user.id,
  };

  const editingId = formData.get('editing_id') as string | null;

  if (editingId) {
    const { error } = await supabase.from('artistas').update(payload).eq('id', editingId).eq('user_id', user.id);
    if (error) return { error: error.message };
    revalidatePath('/artistas');
    revalidatePath('/mi-cuenta');
    return { success: true, artistaId: editingId, slug };
  } else {
    const { data, error } = await supabase.from('artistas').insert([payload]).select('id').single();
    if (error) return { error: error.message };
    revalidatePath('/artistas');
    revalidatePath('/mi-cuenta');
    return { success: true, artistaId: data.id, slug };
  }
}
