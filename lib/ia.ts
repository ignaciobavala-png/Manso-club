import { createDeepSeek } from '@ai-sdk/deepseek';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Modelo de DeepSeek. Los alias `deepseek-chat` y `deepseek-reasoner` se
 * retiraron el 24/07/2026; `deepseek-v4-flash` es el vigente. Se puede cambiar
 * sin tocar código con DEEPSEEK_MODEL.
 */
export const MODELO_IA = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';

/**
 * Modelo perezoso: no se arma al importar el módulo, así `next build` no
 * revienta en un entorno sin la key (preview, CI).
 */
export function getModeloIA() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('Falta DEEPSEEK_API_KEY en las variables de entorno.');
  return createDeepSeek({ apiKey })(MODELO_IA);
}

/**
 * Las rutas /api NO pasan por proxy.ts (solo cubre /mansoadm), así que cada
 * endpoint de IA tiene que comprobar el rol él mismo, ANTES de gastar un token.
 * El rol sale de la sesión en el servidor, nunca de un header del cliente.
 */
export async function exigirAdmin(): Promise<{ ok: true; userId: string; email: string | null; supabase: SupabaseClient } | { ok: false; respuesta: NextResponse }> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, respuesta: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) };

  const { data: role } = await supabase.rpc('get_user_role', { user_id: user.id });
  if (role !== 'admin') return { ok: false, respuesta: NextResponse.json({ error: 'Prohibido' }, { status: 403 }) };

  return { ok: true, userId: user.id, email: user.email ?? null, supabase };
}
