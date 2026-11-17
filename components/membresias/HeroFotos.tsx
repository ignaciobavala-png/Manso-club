'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

interface Props {
  fotos: { id: string; src: string }[];
  /** Una foto que no carga se avisa para sacarla también del mosaico. */
  onError?: (id: string) => void;
  /** Id del bloque al que baja el click (el mosaico "El espacio"). */
  destino?: string;
  claro?: boolean;
}

const CADA_MS = 4500;

/**
 * Marco vertical del hero de /membresías: las mismas fotos de la galería,
 * pasando solas con un fundido. Es un adelanto del mosaico de abajo, no una
 * carga aparte: no hay nada nuevo que mantener en el panel.
 *
 * Se pausa con el mouse encima y no rota si la persona pidió menos movimiento.
 */
export function HeroFotos({ fotos, onError, destino, claro = false }: Props) {
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [reducido, setReducido] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducido(mq.matches);
    const cambio = (e: MediaQueryListEvent) => setReducido(e.matches);
    mq.addEventListener('change', cambio);
    return () => mq.removeEventListener('change', cambio);
  }, []);

  const total = fotos.length;

  useEffect(() => {
    if (total < 2 || pausado || reducido) return;
    const t = setInterval(() => setActual((i) => (i + 1) % total), CADA_MS);
    return () => clearInterval(t);
  }, [total, pausado, reducido]);

  if (total === 0) return null;

  const indice = Math.min(actual, total - 1);
  const bajar = () => {
    if (destino) document.getElementById(destino)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <button
      type="button"
      onClick={bajar}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      aria-label="Ver las fotos del espacio"
      className={`group relative block w-full md:w-[46%] lg:w-[52%] shrink-0 aspect-[16/10] md:aspect-[4/3] overflow-hidden rounded-2xl border ${claro ? 'border-manso-black/20' : 'border-manso-cream/20'} bg-manso-black text-left`}
    >
      {fotos.map((f, i) => (
        <Image
          key={f.id}
          src={f.src}
          alt=""
          fill
          priority={i === 0}
          sizes="(min-width: 1400px) 728px, (min-width: 768px) 52vw, 100vw"
          quality={90}
          onError={() => onError?.(f.id)}
          className={`object-cover transition-opacity duration-1000 ${i === indice ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      <span className="absolute top-3 left-3 bg-manso-cream text-manso-black text-[10px] font-black uppercase tracking-[0.25em] px-2 py-1">
        El espacio
      </span>
      <span className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-manso-cream text-[11px] font-bold uppercase tracking-[0.2em]">
        <span>{String(indice + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
        <span aria-hidden className="transition-transform duration-300 group-hover:translate-y-1">↓</span>
      </span>
    </button>
  );
}
