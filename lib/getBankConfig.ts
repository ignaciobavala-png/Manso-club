import { createSupabaseAnon } from '@/lib/supabase';

export async function getBankConfig(): Promise<Record<string, string>> {
  const supabase = createSupabaseAnon();
  const { data } = await supabase
    .from('checkout_config')
    .select('key, value')
    .in('key', ['banco_nombre', 'banco_cbu', 'banco_alias', 'banco_titular', 'banco_cuit']);

  const config: Record<string, string> = {};
  data?.forEach(({ key, value }) => { config[key] = value; });
  return config;
}
