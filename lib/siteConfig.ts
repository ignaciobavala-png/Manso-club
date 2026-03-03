import { supabase } from './supabase';

export async function getSiteConfig(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('site_config')
    .select('key, value');
  if (error) throw error;
  const config: Record<string, string> = {};
  (data ?? []).forEach(({ key, value }) => {
    if (value) config[key] = value;
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
