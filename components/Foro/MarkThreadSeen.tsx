'use client';

import { useEffect } from 'react';

const SEEN_KEY = 'foro_seen_replies';

// Marca este thread (propio) como visto con su reply_count actual, para que
// el badge de notificaciones del navbar deje de mostrarlo como "nuevo".
export function MarkThreadSeen({ threadId, replyCount }: { threadId: string; replyCount: number }) {
  useEffect(() => {
    try {
      const seen = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '{}');
      seen[threadId] = replyCount;
      localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
    } catch {
      // localStorage no disponible (modo privado, etc.) — no rompe la vista.
    }
  }, [threadId, replyCount]);

  return null;
}
