'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { activarPixelBlur, pixelBlur } from '@/lib/pixel-blur';

/**
 * Píxel de Meta propio de BLUR (/blurfestival). Ver `lib/pixel-blur.ts`: el del
 * root layout es el de Manso; este se suma como segundo píxel. Una visita a
 * BLUR cuenta también en el de Manso, que es lo esperado: es una página del
 * mismo dominio.
 *
 * Acá van los eventos de navegación (PageView en cada pantalla, ViewContent en
 * la de tickets). Los de compra viven donde pasa la acción: `TablaTickets`
 * (AddToCart, InitiateCheckout) y `PixelCompra` (Purchase).
 */
export function PixelBlur() {
  const ruta = usePathname();

  // Habilita el píxel mientras este componente esté montado (borrador y admins no lo montan).
  useEffect(() => {
    activarPixelBlur(true);
    return () => activarPixelBlur(false);
  }, []);

  useEffect(() => {
    // Cada pantalla es un PageView: el App Router navega sin recargar.
    void pixelBlur('PageView');
    if (ruta === '/blurfestival/tickets') {
      void pixelBlur('ViewContent', { content_name: 'Entradas BLUR', content_type: 'product' });
    }
  }, [ruta]);

  return null;
}
