'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Membresia } from '@/lib/types/membresia';
import { fondoAcento } from '@/lib/membresia-color';
import { CoworkModal, PARAM_FORM } from './CoworkModal';

interface MembresiaCardProps {
  membresia: Membresia;
  currency: string;
  rate: number | null;
}

/**
 * Card de membresía — rediseño a partir de la refe que trajo Ana
 * (somoseito.io): tarjeta alta de fondo crema, borde fino, sin sombra ni
 * redondeo; el nombre del plan arriba y enorme en la tipografía del hero, el
 * precio rotado en el margen izquierdo, y abajo la descripción corta con el
 * botón a todo el ancho.
 *
 * La card ya no lista beneficios: en la refe la tarjeta solo lleva la
 * "descripción de la tarjetita" y los beneficios viven en el bloque INCLUYE de
 * la página de detalle.
 */
export const MembresiaCard = ({ membresia, currency, rate }: MembresiaCardProps) => {
  const [formAbierto, setFormAbierto] = useState(false);
  const cultural = membresia.es_cultural;

  // Link compartido de este plan (?form=<id>): abre su formulario al entrar.
  useEffect(() => {
    if (cultural) return;
    const param = new URLSearchParams(window.location.search).get(PARAM_FORM);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (param === membresia.id) setFormAbierto(true);
  }, [membresia.id, cultural]);

  // La cultural va en color pleno y sin precio; el resto en crema.
  const cText = cultural ? 'text-manso-cream' : 'text-manso-black';
  const cMuted = cultural ? 'text-manso-cream/70' : 'text-manso-black/55';
  const cBorde = cultural ? 'border-transparent' : 'border-manso-black/20';
  const cFondo = cultural ? fondoAcento(membresia.color_acento) : 'bg-manso-cream';
  const cBoton = cultural
    ? 'bg-manso-cream text-manso-black'
    : 'bg-manso-black text-manso-cream';

  const precio =
    currency === 'ARS' && rate
      ? Math.round(membresia.precio * rate).toLocaleString('es-AR')
      : membresia.precio.toLocaleString('es-AR');

  const descripcion = membresia.descripcion_corta?.trim() || membresia.descripcion?.trim();
  // Cultural Manso tiene página propia —y su propia sección en el panel—, así
  // que su card sale del detalle genérico y va derecho ahí.
  const detalle = cultural
    ? '/mansocultural'
    : membresia.slug
      ? `/membresias/${membresia.slug}`
      : null;

  return (
    <article
      className={`group relative flex w-full h-full min-h-[218px] sm:min-h-[440px] border ${cBorde} ${cFondo} transition-colors duration-300`}
    >
      {/* El cuerpo de la card lleva al detalle; el botón, directo al formulario.
          Va como capa debajo del contenido en vez de envolverlo porque un
          <button> dentro de un <a> no es HTML válido. */}
      {detalle && (
        <Link href={detalle} className="absolute inset-0 z-0" aria-label={`Ver ${membresia.nombre}`}>
          <span className="sr-only">Ver {membresia.nombre}</span>
        </Link>
      )}

      <div className="relative z-10 flex w-full pointer-events-none">
        {/* Margen izquierdo con el precio rotado, como en la refe. Cultural
            Manso no es un plan y no tiene precio: el margen queda vacío para
            que el título siga alineado con el de las cards vecinas. */}
        <div className="w-6 sm:w-10 shrink-0 flex items-end justify-center pb-2.5 sm:pb-5">
          {!cultural && (
            <span
              className={`[writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] ${cMuted}`}
            >
              {currency} {precio} / {membresia.periodo}
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col min-w-0 p-2.5 pl-0 sm:p-6 sm:pl-0">
          {/* El slot va siempre, con o sin badge: si no, el título de la card
              destacada baja y queda desalineado del de las vecinas. */}
          <span className="h-3 sm:h-4 text-[7px] sm:text-[9px] font-black uppercase tracking-[0.15em] sm:tracking-[0.3em] text-manso-terra">
            {membresia.destacado ? 'Más popular' : ''}
          </span>

          {/* `break-words` y no `truncate`: un nombre largo baja de línea, que es
              justo lo que hace la refe con "Half day pass". */}
          <h3
            className={`font-montreal font-black tracking-[-0.03em] leading-[0.95] text-[15px] sm:text-[2.75rem] break-words ${cText}`}
          >
            {membresia.nombre}
          </h3>

          <div className="mt-auto pt-4 sm:pt-8">
            {descripcion && (
              <p className={`text-[10px] sm:text-xs leading-relaxed whitespace-pre-line mb-2.5 sm:mb-4 ${cMuted}`}>
                {descripcion}
              </p>
            )}

            {/* SELECCIONAR abre el formulario de inscripción, no el checkout: el
                alta al cowork pasa primero por una solicitud que Ana aprueba.
                La cultural no se solicita: su botón es parte del link que
                envuelve la card, así que va como <span> —un <a> dentro de otro
                <a> no es HTML válido— y el click lo toma la capa de abajo. */}
            {cultural ? (
              <span
                className={`flex items-center justify-center w-full px-2 sm:px-4 min-h-[44px] text-[8px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.25em] transition-opacity duration-200 group-hover:opacity-80 ${cBoton}`}
              >
                Conocer más
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setFormAbierto(true)}
                className={`pointer-events-auto flex items-center justify-center w-full px-2 sm:px-4 min-h-[44px] text-[8px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.25em] transition-opacity duration-200 hover:opacity-80 active:scale-[0.98] ${cBoton}`}
              >
                Seleccionar
              </button>
            )}
          </div>
        </div>
      </div>

      {!cultural && (
        <CoworkModal
          open={formAbierto}
          onClose={() => setFormAbierto(false)}
          origen="membresia"
          membresiaId={membresia.id}
          membresiaNombre={membresia.nombre}
        />
      )}
    </article>
  );
};
