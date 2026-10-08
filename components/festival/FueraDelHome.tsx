'use client';

import { usePathname } from 'next/navigation';

/**
 * Lo que no va en el home del festival, donde la foto ocupa toda la pantalla
 * (hoy, el pie). El layout es de servidor y no sabe en qué página está.
 */
export function FueraDelHome({ children }: { children: React.ReactNode }) {
  return usePathname() === '/blur' ? null : <>{children}</>;
}
