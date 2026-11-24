'use client';

import { useEffect, useRef, useState } from 'react';
import { useTextos } from '@/components/festival/Idioma';

/**
 * Un QR de entrada pensado para la puerta: grande en la tarjeta y, al tocarlo,
 * en pantalla completa sobre blanco (el lector rinde más con contraste máximo y
 * sin nada alrededor). Mantiene la pantalla prendida mientras está abierto y se
 * cierra con un toque o Escape. "Guardar imagen" baja el PNG para tenerlo sin
 * señal.
 */
export function QrEntrada({
  qr,
  alt,
  titulo,
  codigo,
  rotulo,
  usado,
  nombreArchivo,
}: {
  qr: string;
  alt: string;
  titulo: string;
  codigo: string;
  rotulo: string;
  usado: boolean;
  nombreArchivo: string;
}) {
  const t = useTextos().compra;
  const [grande, setGrande] = useState(false);
  const abrir = useRef<HTMLButtonElement>(null);
  const cerrar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!grande) return;
    const origen = abrir.current;
    cerrar.current?.focus();
    const alTeclado = (e: KeyboardEvent) => e.key === 'Escape' && setGrande(false);
    window.addEventListener('keydown', alTeclado);
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Que el celular no se apague mientras lo escanean. No en todos los navegadores.
    let candado: WakeLockSentinel | null = null;
    navigator.wakeLock?.request('screen').then(c => (candado = c)).catch(() => {});

    return () => {
      window.removeEventListener('keydown', alTeclado);
      document.body.style.overflow = antes;
      candado?.release().catch(() => {});
      origen?.focus();
    };
  }, [grande]);

  return (
    <li className="border border-[var(--fest-texto)]/25 p-5 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left sm:items-center sm:gap-6">
      <button
        ref={abrir}
        type="button"
        onClick={() => setGrande(true)}
        aria-label={`${t.verGrande}: ${titulo}`}
        className="shrink-0 bg-white p-1 cursor-zoom-in"
      >
        <img src={qr} alt={alt} width={220} height={220} className={`block w-[min(62vw,240px)] sm:w-[190px] h-auto ${usado ? 'opacity-40' : ''}`} />
      </button>

      <div className="min-w-0 w-full">
        <p className="fest-mono text-[10px] uppercase tracking-[0.25em] opacity-55">{rotulo}</p>
        <p className="fest-angosta text-2xl leading-none mt-1.5">{titulo}</p>
        <p className="fest-mono text-sm mt-2 tracking-[0.15em]">{codigo}</p>
        {usado && <p className="fest-mono text-[10px] uppercase mt-1 text-[var(--fest-acento)]">{t.usada}</p>}

        <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
          <button type="button" onClick={() => setGrande(true)} className="fest-menu text-[14px] px-4 py-2.5 bg-[var(--fest-acento)] text-black min-h-[44px]">
            {t.verGrande}
          </button>
          <a href={qr} download={nombreArchivo} className="fest-menu text-[14px] px-4 py-2.5 border border-[var(--fest-texto)]/40 min-h-[44px] inline-flex items-center">
            {t.guardarImagen}
          </a>
        </div>
      </div>

      {grande && (
        <div role="dialog" aria-modal="true" aria-label={titulo} onClick={() => setGrande(false)} className="fixed inset-0 z-[200] bg-white text-black flex flex-col items-center justify-center gap-5 p-4 cursor-pointer">
            <img src={qr} alt={alt} className="block w-[min(88vw,64vh)] h-auto" />
          <div className="text-center">
            <p className="fest-angosta text-3xl leading-none">{titulo}</p>
            <p className="fest-mono text-base mt-2 tracking-[0.2em]">{codigo}</p>
            <p className="mt-4 text-[15px] max-w-[34ch] mx-auto">{t.brillo}</p>
          </div>
          <button ref={cerrar} type="button" onClick={() => setGrande(false)} className="fest-menu px-8 py-3.5 bg-black text-white min-h-[48px]">
            {t.cerrar}
          </button>
          <span className="sr-only">{t.cerrarAyuda}</span>
        </div>
      )}
    </li>
  );
}
