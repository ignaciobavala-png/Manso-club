'use client';

import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  imagenes: string[];
  /** Índice de la foto que se está viendo. */
  indice: number;
  alt: string;
  onCerrar: () => void;
  onCambiar: (indice: number) => void;
}

/**
 * Foto a pantalla completa, para mirar el detalle de un producto.
 *
 * La imagen va en `object-contain`: acá no se recorta nada, que es todo el
 * punto de abrirla —en la ficha y en la grilla se ven cuadradas y con
 * `object-cover`, así que una foto apaisada llega cortada a los costados—.
 *
 * Se cierra con Escape, con la X o tocando el fondo. Mientras está abierta el
 * body no scrollea: en teléfono, si no, el dedo mueve la página de atrás.
 */
export function Lightbox({ imagenes, indice, alt, onCerrar, onCambiar }: Props) {
  const total = imagenes.length;
  const hayVarias = total > 1;

  useEffect(() => {
    const onTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
      if (!hayVarias) return;
      if (e.key === 'ArrowRight') onCambiar((indice + 1) % total);
      if (e.key === 'ArrowLeft') onCambiar((indice - 1 + total) % total);
    };

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onTecla);

    return () => {
      document.body.style.overflow = overflowPrevio;
      window.removeEventListener('keydown', onTecla);
    };
  }, [indice, total, hayVarias, onCerrar, onCambiar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onCerrar}
      className="fixed inset-0 z-[100] bg-manso-black/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
    >
      <button
        type="button"
        onClick={onCerrar}
        title="Cerrar"
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-manso-cream/10 text-manso-cream hover:bg-manso-cream hover:text-manso-black transition-colors"
      >
        <X size={20} />
      </button>

      {hayVarias && (
        <>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onCambiar((indice - 1 + total) % total); }}
            title="Anterior"
            className="absolute left-2 sm:left-6 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-manso-cream/10 text-manso-cream hover:bg-manso-cream hover:text-manso-black transition-colors"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onCambiar((indice + 1) % total); }}
            title="Siguiente"
            className="absolute right-2 sm:right-6 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-manso-cream/10 text-manso-cream hover:bg-manso-cream hover:text-manso-black transition-colors"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <img
        src={imagenes[indice]}
        alt={alt}
        // El click en la foto no cierra: cerrar es tocar el fondo.
        onClick={e => e.stopPropagation()}
        className="max-h-[85vh] max-w-full object-contain rounded-lg"
        onError={e => { e.currentTarget.src = '/manso.png'; }}
      />

      {hayVarias && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
          {imagenes.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={e => { e.stopPropagation(); onCambiar(i); }}
              title={`Foto ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === indice ? 'bg-manso-cream w-6' : 'bg-manso-cream/40 w-1.5'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
