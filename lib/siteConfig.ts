import { supabase } from './supabase';

export async function getSiteConfig(): Promise<Record<string, any>> {
  const { data, error } = await supabase
    .from('site_config')
    .select('key, value, visible');
  if (error) throw error;
  const config: Record<string, any> = {};
  (data ?? []).forEach(({ key, value, visible }) => {
    if (value) config[key] = { value, visible: visible ?? true };
  });
  return config;
}

export const revalidate = 60; // revalida cada 60 segundos

export async function setSiteConfig(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('site_config')
    .upsert({ key, value }, { onConflict: 'key' });
  if (error) throw error;
}

export async function setSiteConfigVisibility(key: string, visible: boolean): Promise<void> {
  const { error } = await supabase
    .from('site_config')
    .update({ visible })
    .eq('key', key);
  if (error) throw error;
}
