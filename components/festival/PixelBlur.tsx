'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Píxel de Meta propio de BLUR (/blurfestival). El del root layout es el de
 * Manso y también corre acá (carga fbevents.js); este se suma como segundo
 * píxel con `init` y sus PageView van con `trackSingle`, para que cada píxel
 * cuente solo lo suyo. Una visita a BLUR cuenta también en el de Manso, que es
 * lo esperado: es una página del mismo dominio.
 */
const PIXEL_BLUR = '999072999344305';

type Fbq = (...args: unknown[]) => void;

export function PixelBlur() {
  const ruta = usePathname();

  useEffect(() => {
    const w = window as unknown as { fbq?: Fbq; __pixelBlur?: boolean };
    const enviar = () => {
      if (!w.fbq) return false;
      if (!w.__pixelBlur) {
        w.fbq('init', PIXEL_BLUR);
        w.__pixelBlur = true;
      }
      // Cada pantalla es un PageView: el App Router navega sin recargar.
      w.fbq('trackSingle', PIXEL_BLUR, 'PageView');
      return true;
    };
    if (enviar()) return;
    // El script del root (afterInteractive) puede llegar después de la hidratación.
    const t = setInterval(() => {
      if (enviar()) clearInterval(t);
    }, 300);
    const corte = setTimeout(() => clearInterval(t), 10000);
    return () => {
      clearInterval(t);
      clearTimeout(corte);
    };
  }, [ruta]);

  return null;
}
