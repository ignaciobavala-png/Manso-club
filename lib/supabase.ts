import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Esto asegura que la sesión se guarde en una cookie que el middleware pueda leer
    storageKey: 'sb-manso-auth-token',
    debug: true, // Activar modo debug para ver qué pasa
  }
});