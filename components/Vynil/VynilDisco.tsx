'use client';

import { thumbDeTema, type TemaVynil } from '@/lib/vynil';

interface Props {
  tema?: TemaVynil | null;
  /** Diámetro en px. */
  tamano: number;
  girando?: boolean;
  /** Segundos por vuelta. El grande gira más lento para no marear. */
  vuelta?: number;
  className?: string;
}

/**
 * El vinilo. Es la forma del reproductor entero, no un adorno: el mismo disco
 * es el botón flotante cuando está chico y la bandeja del panel cuando está
 * grande. El label es la portada del tema.
 */
export function VynilDisco({ tema, tamano, girando = false, vuelta = 3.5, className = '' }: Props) {
  const thumb = tema ? thumbDeTema(tema) : null;
  const agujero = Math.max(4, Math.round(tamano * 0.035));

  return (
    <span
      className={`relative block shrink-0 rounded-full ring-1 ring-black/60 ${className}`}
      style={{
        width: tamano,
        height: tamano,
        background: 'repeating-radial-gradient(circle at 50% 50%, #121212 0 2.5px, #1c1c1c 2.5px 4px)',
        animation: girando ? `spin ${vuelta}s linear infinite` : undefined,
      }}
    >
      {/* Label: la portada del tema, o el rojo Manso si no hay */}
      <span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden"
        style={{ width: '38%', height: '38%' }}
      >
        {thumb ? (
          <img src={thumb} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="block w-full h-full bg-manso-terra" />
        )}
      </span>

      {/* Agujero */}
      <span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-manso-black ring-1 ring-black/80"
        style={{ width: agujero, height: agujero }}
      />

      {/* Brillo, para que el disco no quede plano */}
      <span
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            'conic-gradient(from 200deg, rgba(255,252,220,.14), transparent 90deg, rgba(255,252,220,.08) 200deg, transparent 300deg)',
        }}
      />
    </span>
  );
}
