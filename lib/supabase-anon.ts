import { createClient } from '@supabase/supabase-js';

// Anonymous server-side client for public data fetching.
// Does NOT interact with cookies or auth sessions, avoiding
// AuthApiError when stale refresh tokens exist in cookies.
export function createSupabaseAnon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
