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

export function useUser() {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('display_name, email, avatar_url')
      .eq('id', userId)
      .single();
    setProfile(data);
    setLoading(false);
  };

  // Re-verifica en cada navegación — captura logins/logouts hechos server-side
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      setUser(user ?? null);
      if (user) fetchProfile(user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => { active = false; };
  }, [pathname]);

  // Listener para cambios client-side (logout desde el propio browser)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchProfile(u.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  return { user, profile, loading };
}
