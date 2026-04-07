import { supabase } from './supabase';

export interface HeroSlide {
  id: string;
  tag: string | null;
  title_line1: string;
  title_line2: string | null;
  description: string | null;
  tipo: 'texto' | 'imagen' | 'video';
  media_url: string | null;
  media_url_desktop: string | null;
  media_url_mobile: string | null;
  order_index: number;
  active: boolean;
  device_type: 'desktop' | 'mobile' | 'ambos';
}

export async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    const { data, error } = await supabase
      .from('hero_config')
      .select('*')
      .eq('active', true)
      .order('order_index', { ascending: true });
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getHeroSlidesByDevice(device: 'desktop' | 'mobile'): Promise<HeroSlide[]> {
  try {
    const { data, error } = await supabase
      .from('hero_config')
      .select('*')
      .eq('active', true)
      .or(`device_type.eq.ambos,device_type.eq.${device}`)
      .order('order_index', { ascending: true });
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export function getMediaUrlForDevice(slide: HeroSlide, device: 'desktop' | 'mobile'): string | null {
  // Prioridad: campo específico del dispositivo > campo general > null
  if (device === 'desktop') {
    return slide.media_url_desktop || slide.media_url || null;
  } else {
    return slide.media_url_mobile || slide.media_url || null;
  }
}

export const revalidate = 30;

export async function getAllHeroSlides(): Promise<HeroSlide[]> {
  try {
    const { data, error } = await supabase
      .from('hero_config')
      .select('*')
      .order('order_index', { ascending: true });
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}
