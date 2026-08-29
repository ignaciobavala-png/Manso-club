'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays } from 'lucide-react';
import { useUser } from '@/hooks/useUser';

/**
 * Botón flotante (estilo WhatsApp) para acceder al calendario desde cualquier página.
 * Se oculta en el calendario mismo, el admin y el login, y en mobile no se muestra
 * (la columna de flotantes queda en WhatsApp + Vynil). Si el botón de WhatsApp está
 * visible (usuarios no logueados), se apila encima de él; si no, ocupa su lugar.
 */
export function CalendarioFab() {
  const pathname = usePathname();
  const { user, loading } = useUser();

  if (
    pathname?.startsWith('/calendario') ||
    pathname?.startsWith('/mansoadm') ||
    pathname?.startsWith('/login')
  ) {
    return null;
  }

  // Misma condición de visibilidad que WhatsAppButton (ver components/ui/WhatsAppButton.tsx).
  const whatsappVisible = !loading && !user && !pathname?.startsWith('/foro');

  return (
    <div className={`hidden sm:block fixed right-4 z-50 ${whatsappVisible ? 'bottom-28' : 'bottom-6'}`}>
      <Link
        href="/calendario"
        aria-label="Ver calendario de talleres y eventos"
        className="group flex items-center justify-center relative"
      >
        {/* Animación de pulso externa */}
        <span className="absolute inline-flex h-full w-full rounded-full bg-manso-terra opacity-30 animate-ping group-hover:animate-none"></span>

        {/* Tooltip lateral */}
        <span className="absolute right-20 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-sm opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap translate-x-4 group-hover:translate-x-0">
          Calendario_
        </span>

        <div className="relative bg-manso-terra text-manso-cream p-4 rounded-full shadow-[0_10px_20px_rgba(188,41,21,0.35)] transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 flex items-center justify-center">
          <CalendarDays size={28} strokeWidth={2} />
        </div>
      </Link>
    </div>
  );
}
