import { supabase } from './supabase';
import { createSupabaseAnon } from './supabase';

export interface ManifiestoContent {
  id: string;
  contenido: string;
  updated_at: string;
}

export async function getManifiesto(): Promise<ManifiestoContent> {
  const fallback: ManifiestoContent = { id: 'fallback', contenido: '', updated_at: new Date().toISOString() };
  try {
    const client = createSupabaseAnon();
    const { data, error } = await client
      .from('manifiesto')
      .select('*')
      .single();
    if (error || !data) return fallback;
    return data as ManifiestoContent;
  } catch {
    return fallback;
  }
}

export async function updateManifiesto(id: string, contenido: string): Promise<void> {
  const { error } = await supabase
    .from('manifiesto')
    .update({ contenido, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error('Error al guardar el manifiesto');
}
