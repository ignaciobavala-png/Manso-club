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
 * Acá va solo el PageView de cada pantalla. Los de compra viven donde pasa la
 * acción y donde están los precios: `TablaTickets` (ViewContent, AddToCart,
 * InitiateCheckout) y `PixelCompra` (Purchase). Todos llevan `value` en ARS.
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
  }, [ruta]);

  return null;
}
