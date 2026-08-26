'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useVynil } from '@/store/useVynil';
import { VynilModal } from './VynilModal';

/**
 * Botón flotante con forma de vinilo. Se apila sobre el de calendario, que a su
 * vez se apila sobre el de WhatsApp — de ahí las tres alturas posibles.
 */
export function VynilFab() {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const [abierto, setAbierto] = useState(false);
  const temas = useVynil(s => s.temas);
  const mixInvitado = useVynil(s => s.mixInvitado);
  const sonando = useVynil(s => s.sonando);

  if (
    pathname?.startsWith('/mansoadm') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/registro')
  ) {
    return null;
  }

  // Mismas condiciones que CalendarioFab y WhatsAppButton, para apilarse bien.
  const whatsappVisible = !loading && !user && !pathname?.startsWith('/foro');
  const calendarioVisible = !pathname?.startsWith('/calendario');

  const bottom = calendarioVisible
    ? whatsappVisible
      ? 'bottom-[12.5rem]'
      : 'bottom-28'
    : whatsappVisible
      ? 'bottom-28'
      : 'bottom-6';

  const cantidad = (mixInvitado ?? temas).length;

  return (
    <>
      <div className={`fixed right-4 z-50 ${bottom}`}>
        <button
          onClick={() => setAbierto(true)}
          aria-label="Tu lista de temas para recorrer Manso"
          className="group flex items-center justify-center relative"
        >
          {/* Tooltip lateral, igual que los otros flotantes */}
          <span className="absolute right-20 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-sm opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap translate-x-4 group-hover:translate-x-0">
            Tu música_
          </span>

          {/* Vinilo */}
          <span
            className={`relative block w-[60px] h-[60px] rounded-full ring-1 ring-black/60 shadow-[0_10px_20px_rgba(0,0,0,0.45)] transition-transform duration-500 group-hover:scale-110 ${
              sonando ? 'animate-[spin_3.5s_linear_infinite]' : ''
            }`}
            style={{
              background:
                'repeating-radial-gradient(circle at 50% 50%, #121212 0 2.5px, #1c1c1c 2.5px 4px)',
            }}
          >
            {/* Label */}
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[38%] h-[38%] rounded-full bg-manso-terra" />
            {/* Agujero */}
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full bg-manso-black" />
            {/* Brillo */}
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  'conic-gradient(from 200deg, rgba(255,252,220,.14), transparent 90deg, rgba(255,252,220,.08) 200deg, transparent 300deg)',
              }}
            />
          </span>

          {cantidad > 0 && (
            <span className="absolute -top-1 -left-1 min-w-[20px] h-5 px-1 rounded-full bg-manso-cream text-manso-black text-[10px] font-black flex items-center justify-center ring-2 ring-manso-black">
              {cantidad}
            </span>
          )}
        </button>
      </div>

      <VynilModal open={abierto} onClose={() => setAbierto(false)} />
    </>
  );
}
