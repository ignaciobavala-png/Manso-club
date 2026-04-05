import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client for client components
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Server client with cookies for server components and API routes
export async function createSupabaseServer() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method is called from a Server Component where
            // cookies cannot be modified. This can safely be ignored when
            // the client is only used to read session data.
          }
        },
      },
    }
  );
}

// Anonymous server-side client for public data fetching
// Does NOT interact with cookies or auth sessions, avoiding
// AuthApiError when stale refresh tokens exist in cookies
export function createSupabaseAnon() {
  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}