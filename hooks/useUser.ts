'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

const AUTH_PAGES = ['/login', '/registro', '/recuperar-contrasena', '/actualizar-contrasena'];

export function useUser() {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole]       = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const fetchProfile = async (userId: string) => {
    const [{ data: profileData }, { data: roleData }] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('display_name, email, avatar_url')
        .eq('id', userId)
        .single(),
      supabase.rpc('get_user_role', { user_id: userId }),
    ]);
    setProfile(profileData);
    setRole(roleData as string | null);
    setLoading(false);
  };

  // Re-verifica en cada navegación — captura logins/logouts hechos server-side
  useEffect(() => {
    if (AUTH_PAGES.includes(pathname)) {
      setUser(null); setProfile(null); setRole(null); setLoading(false);
      return;
    }
    let active = true;
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (!active) return;
      if (error) { setUser(null); setProfile(null); setRole(null); setLoading(false); return; }
      setUser(user ?? null);
      if (user) fetchProfile(user.id);
      else { setProfile(null); setRole(null); setLoading(false); }
    });
    return () => { active = false; };
  }, [pathname]);

  // Listener para cambios client-side (logout desde el propio browser)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (AUTH_PAGES.includes(pathname)) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchProfile(u.id);
      else { setProfile(null); setRole(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, [pathname]);

  return { user, profile, role, loading };
}
