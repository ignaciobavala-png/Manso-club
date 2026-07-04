'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Sin tablas nuevas: guardamos en localStorage cuántas respuestas ya vio el
// usuario por cada thread propio, y comparamos contra reply_count actual.
const SEEN_KEY = 'foro_seen_replies';

export function useForoNotifications(userId: string | null) {
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    if (!userId) { setHasNew(false); return; }
    let active = true;

    supabase
      .from('foro_threads')
      .select('id, reply_count')
      .eq('autor_id', userId)
      .gt('reply_count', 0)
      .then(({ data }) => {
        if (!active || !data) return;

        let seen: Record<string, number> = {};
        try {
          seen = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '{}');
        } catch {
          seen = {};
        }

        setHasNew(data.some((t) => (seen[t.id] ?? 0) < t.reply_count));
      });

    return () => { active = false; };
  }, [userId]);

  return hasNew;
}
