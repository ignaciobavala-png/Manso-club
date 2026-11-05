'use client';

import { useEffect, useState } from 'react';
import { useIdioma } from '@/components/festival/Idioma';
import { TEXTOS_VOLUNTARIOS } from '@/lib/festival-voluntarios-textos';

/**
 * "Quiero sumarme" fijo abajo en el celular, que se esconde cuando el
 * formulario ya está en pantalla. A la izquierda: la derecha es del botón
 * TICKETS fijo del menú.
 */
export function BotonFlotanteVoluntarios() {
  const t = TEXTOS_VOLUNTARIOS[useIdioma()].flotante;
  const [formularioVisible, setFormularioVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById('formulario');
    if (!el) return;
    const obs = new IntersectionObserver(([entrada]) => setFormularioVisible(entrada.isIntersecting), {
      threshold: 0.05,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (formularioVisible) return null;
  return (
    <a
      href="#formulario"
      className="sm:hidden fixed left-4 bottom-4 z-30 fest-menu text-[17px] leading-[1.3] px-[0.5em] py-2 bg-[var(--fest-resalte)] text-[#003009] shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
    >
      {t}
    </a>
  );
}
