import { supabase } from './supabase';

export interface GalleryImage {
  id: string;
  photo_url: string;
  order_index: number;
  active: boolean;
}

export async function getGalleryImages(): Promise<GalleryImage[]> {
  const { data, error } = await supabase
    .from('gallery_images')
    .select('*')
    .eq('active', true)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export const revalidate = 60; // revalida cada 60 segundos

export async function getAllGalleryImages(): Promise<GalleryImage[]> {
  const { data, error } = await supabase
    .from('gallery_images')
    .select('*')
    .order('order_index', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
