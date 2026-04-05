import { supabase } from './supabase';

export interface GalleryImage {
  id: string;
  photo_url: string;
  order_index: number;
  active: boolean;
}

export async function getGalleryImages(): Promise<GalleryImage[]> {
  try {
    const { data, error } = await supabase
      .from('gallery_images')
      .select('*')
      .eq('active', true)
      .order('order_index', { ascending: true });
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export const revalidate = 60;

export async function getAllGalleryImages(): Promise<GalleryImage[]> {
  try {
    const { data, error } = await supabase
      .from('gallery_images')
      .select('*')
      .order('order_index', { ascending: true });
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}
