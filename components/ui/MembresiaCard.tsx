'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { Membresia } from '@/lib/types/membresia';

interface MembresiaCardProps {
  membresia: Membresia;
  currency: string;
  rate: number | null;
  /** Home muestra un resumen: solo beneficios incluidos y un máximo de 3 */
  soloIncluidos?: boolean;
  maxBeneficios?: number;
}

/**
 * Card de membresía — estructura y efecto de hover tomados de las cards de
 * tickets de Labitconf (elevación + escala leve, sombra profunda, lista con
 * bullets en color de acento), pero con la paleta de Manso: card destacada en
 * manso-black, el resto en manso-cream, acento manso-terra.
 */
export const MembresiaCard = ({
  membresia,
  currency,
  rate,
  soloIncluidos = false,
  maxBeneficios,
}: MembresiaCardProps) => {
  const dark = membresia.destacado;

  const cText = dark ? 'text-manso-cream' : 'text-manso-black';
  const cMuted = dark ? 'text-manso-cream/60' : 'text-manso-black/60';
  const cDivider = dark ? 'bg-manso-cream/15' : 'bg-manso-black/15';

  let beneficios = (membresia.membresia_beneficios || []).filter(b => b.texto?.trim());
  if (soloIncluidos) beneficios = beneficios.filter(b => b.incluido);
  if (maxBeneficios) beneficios = beneficios.slice(0, maxBeneficios);

  const precio =
    currency === 'ARS' && rate
      ? Math.round(membresia.precio * rate).toLocaleString('es-AR')
      : membresia.precio.toLocaleString('es-AR');

  return (
    <div
      className={`group relative flex flex-col w-full h-full rounded-2xl p-5 sm:p-6 shadow-lg sm:shadow-[0_20px_50px_rgba(0,0,0,0.5)] sm:will-change-transform sm:transition-transform sm:duration-300 sm:ease-out sm:hover:-translate-y-1.5 sm:hover:scale-[1.035] sm:hover:z-10 ${
        dark
          ? 'bg-manso-black border border-manso-cream/15'
          : 'bg-manso-cream border border-manso-black/10'
      }`}
    >
      {membresia.destacado && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-manso-terra text-manso-cream">
            <Star size={8} />
            Más Popular
          </span>
        </div>
      )}

      {/* Nombre */}
      <h3 className={`text-[11px] font-black uppercase tracking-widest ${cText}`}>
        {membresia.nombre}
      </h3>
      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-manso-terra mt-1">
        {membresia.categoria || 'Cowork'}
      </span>

      {/* Precio: sin nowrap — un monto largo en ARS debe poder bajar de línea
          antes que desbordar la card y meter scroll horizontal en el teléfono. */}
      <div className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className={`text-[10px] font-bold uppercase ${cMuted}`}>{currency}</span>
        <span className={`text-4xl sm:text-5xl font-black leading-none break-all ${cText}`}>{precio}</span>
        <span className={`text-[10px] font-bold uppercase ${cMuted}`}>/{membresia.periodo}</span>
      </div>

      <div className={`h-px my-5 ${cDivider}`} />

      {/* Beneficios */}
      {beneficios.length > 0 && (
        <>
          <div className={`text-[9px] font-black uppercase tracking-[0.3em] mb-3 ${cMuted}`}>
            Incluye
          </div>
          <ul className="flex flex-col gap-3">
            {beneficios.map((beneficio, index) => (
              <li key={beneficio.id || index} className="flex items-start gap-2.5">
                <span
                  className={`shrink-0 w-1.5 h-1.5 rounded-full mt-[7px] ${
                    beneficio.incluido ? 'bg-manso-terra' : dark ? 'bg-manso-cream/25' : 'bg-manso-black/25'
                  }`}
                />
                <span
                  className={`text-sm leading-snug ${
                    beneficio.incluido ? cText : `${cMuted} line-through`
                  }`}
                >
                  {beneficio.texto}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {membresia.descripcion && (
        <p className={`text-sm leading-relaxed mt-4 ${cMuted}`}>{membresia.descripcion}</p>
      )}

      <Link
        href={`/membresias/pagar?nombre=${encodeURIComponent(membresia.nombre)}&precio=${membresia.precio}&periodo=${encodeURIComponent(membresia.periodo)}`}
        className={`mt-auto pt-6 block w-full`}
      >
        <span
          className={`flex items-center justify-center w-full px-4 min-h-[44px] rounded-full text-[10px] font-black uppercase tracking-widest text-center transition-opacity duration-200 hover:opacity-80 active:scale-95 ${
            dark ? 'bg-manso-cream text-manso-black' : 'bg-manso-black text-manso-cream'
          }`}
        >
          SELECCIONAR
        </span>
      </Link>
    </div>
  );
};
