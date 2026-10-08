'use client';

import { usePathname } from 'next/navigation';

/**
 * Rutas que viven dentro del sitio pero no son "Manso": tienen identidad
 * propia, así que no llevan navbar, footer ni los flotantes (player, WhatsApp,
 * calendario, vinilo, cursor).
 */
const RUTAS_SIN_CHROME = ['/blur'];

export function ChromeManso({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (RUTAS_SIN_CHROME.some(r => pathname === r || pathname?.startsWith(`${r}/`))) return null;
  return <>{children}</>;
}
