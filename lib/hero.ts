import { supabase } from './supabase';

export interface HeroSlide {
  id: string;
  tag: string | null;
  title_line1: string;
  title_line2: string | null;
  description: string | null;
  tipo: 'texto' | 'imagen' | 'video';
  media_url: string | null;
  order_index: number;
  active: boolean;
}

export async function getHeroSlides(): Promise<HeroSlide[]> {
  const { data, error } = await supabase
    .from('hero_config')
    .select('*')
    .eq('active', true)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export const revalidate = 30; // revalida cada 30 segundos

export async function getAllHeroSlides(): Promise<HeroSlide[]> {
  const { data, error } = await supabase
    .from('hero_config')
    .select('*')
    .order('order_index', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
