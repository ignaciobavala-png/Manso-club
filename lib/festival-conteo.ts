import { cache } from 'react';
import { createSupabaseServer } from '@/lib/supabase';
import { CONTEO_CONFIG_POR_DEFECTO, ConteoConfig } from '@/lib/types/festival-conteo';

/**
 * Parámetros del conteo para el layout de /blur. Con el cliente con cookies,
 * igual que `leerConfig`: el RLS decide quién la lee.
 *
 * `omitir` es true si quien mira es un admin y el panel pide no contarlo; así
 * el navegador del admin ni carga el medidor.
 */
export const leerConteo = cache(async (): Promise<{ config: ConteoConfig; omitir: boolean }> => {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from('festival_conteo_config').select('*').eq('id', 1).maybeSingle();
  const config: ConteoConfig = { ...CONTEO_CONFIG_POR_DEFECTO, ...(data ?? {}) };
  if (!config.activo) return { config, omitir: true };

  let omitir = false;
  if (config.excluir_admin) {
    const { data: esAdmin } = await supabase.rpc('is_admin');
    omitir = esAdmin === true;
  }
  return { config, omitir };
});
