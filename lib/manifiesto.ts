import { supabase } from './supabase';
import { createSupabaseAnon } from './supabase';

export interface ManifiestoContent {
  id: string;
  contenido: string;
  /** Fondo de la primera slide; la frase va encima. */
  slide1_imagen: string | null;
  slide1_frase: string | null;
  /** Segunda slide: solo la imagen. */
  slide2_imagen: string | null;
  updated_at: string;
}

/** Lo que el panel puede cambiar. El id y la fecha los pone el update. */
export type ManifiestoEditable = Pick<
  ManifiestoContent,
  'contenido' | 'slide1_imagen' | 'slide1_frase' | 'slide2_imagen'
>;

export async function getManifiesto(): Promise<ManifiestoContent> {
  const fallback: ManifiestoContent = {
    id: 'fallback',
    contenido: '',
    slide1_imagen: null,
    slide1_frase: null,
    slide2_imagen: null,
    updated_at: new Date().toISOString(),
  };
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

export async function updateManifiesto(id: string, campos: ManifiestoEditable): Promise<void> {
  const { error } = await supabase
    .from('manifiesto')
    .update({
      ...campos,
      // Una imagen o una frase vacías se guardan como null: así la página
      // distingue "no cargado todavía" de "cargado en blanco".
      slide1_imagen: campos.slide1_imagen || null,
      slide1_frase: campos.slide1_frase?.trim() || null,
      slide2_imagen: campos.slide2_imagen || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error('Error al guardar el manifiesto');
}
