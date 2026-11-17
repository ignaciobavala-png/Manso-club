'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bricolage_Grotesque } from 'next/font/google';
import { Membresia } from '@/lib/types/membresia';
import { fondoAcento, fondoAcentoHoverBoton, fondoHoverPorPosicion } from '@/lib/membresia-color';
import { formatPrecioPlan, precioParaMostrar } from '@/lib/precios';
import { CoworkModal, PARAM_FORM } from './CoworkModal';

/** Tipografía de display de la card: nombre del plan y precio, juntos. El resto va en la del sitio. */
const numeros = Bricolage_Grotesque({ subsets: ['latin'], weight: '800' });

interface MembresiaCardProps {
  membresia: Membresia;
  currency: string;
  rate: number | null;
  /** Lugar de la card entre los planes: decide el color del hover. */
  posicion?: number;
  /** Modo claro de la página: la card pasa a negro sobre el fondo crema. */
  claro?: boolean;
  /** Solo la card cultural: fotos que pasan mientras el mouse está encima. */
  fotos?: string[];
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
export const MembresiaCard = ({ membresia, currency, rate, posicion, claro = false, fotos = [] }: MembresiaCardProps) => {
  const [formAbierto, setFormAbierto] = useState(false);
  const cultural = membresia.es_cultural;

  // Cultural Manso: en reposo es terracota; con el mouse encima, sus fotos pasan
  // a pantalla completa como un flipbook (corte seco, no fundido). En celular no
  // hay hover y la card queda terracota. Con `prefers-reduced-motion` se ve una
  // sola foto fija. Todas se montan desde el inicio (opacity 0) para que ya
  // estén cargadas cuando llega el mouse.
  const hayFotos = cultural && fotos.length > 0;
  const [pasando, setPasando] = useState(false);
  const [foto, setFoto] = useState(0);
  useEffect(() => {
    if (!hayFotos || !pasando || fotos.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setFoto((i) => (i + 1) % fotos.length), 700);
    return () => clearInterval(t);
  }, [hayFotos, pasando, fotos.length]);

  // Link compartido de este plan (?form=<id>): abre su formulario al entrar.
  useEffect(() => {
    if (cultural) return;
    const param = new URLSearchParams(window.location.search).get(PARAM_FORM);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (param === membresia.id) setFormAbierto(true);
  }, [membresia.id, cultural]);

  // La cultural va en color pleno y sin precio; el resto en crema. Al pasar
  // el mouse por cualquier parte de la card (Ana lo pidió así, no solo por
  // SELECCIONAR), se llena con su color de hover y el texto pasa a crema.
  // En modo claro la card es blanca con borde negro fino sobre el crema de la
  // página (refe de Huerta): texto negro de entrada y el mismo hover de color.
  const sobreOscuro = cultural;
  const cText = sobreOscuro
    ? 'text-manso-cream'
    : 'text-manso-black group-hover/card:text-manso-cream';
  const cMuted = sobreOscuro
    ? 'text-manso-cream/70'
    : 'text-manso-black/55 group-hover/card:text-manso-cream/70';
  const cBorde = cultural
    ? 'border-transparent'
    : claro
      ? 'border-manso-black hover:border-transparent'
      : 'border-manso-black/20 hover:border-transparent';
  const cFondo = cultural
    ? fondoAcento(membresia.color_acento)
    : `${claro ? 'bg-white' : 'bg-manso-cream'} ${
        posicion === undefined
          ? fondoAcentoHoverBoton(membresia.color_acento)
          : fondoHoverPorPosicion(posicion)
      }`;
  const cBoton = sobreOscuro
    ? 'bg-manso-cream text-manso-black'
    : 'bg-manso-black text-manso-cream hover:bg-manso-cream hover:text-manso-black';

  // Sin cotización queda el número y la moneda en que se cargó.
  const { monto, moneda } = precioParaMostrar(
    membresia,
    currency === 'ARS' ? 'ARS' : 'USD',
    rate,
  );
  const precio = formatPrecioPlan(monto, moneda);

  const descripcion = membresia.descripcion_corta?.trim() || membresia.descripcion?.trim();
  // Un bullet por cosa que ofrece el plan: por renglón y también por " + "
  // ("Cowork 3 días por semana + espacios comunes"), con mayúscula inicial
  // (al cortar por "+" quedan en minúscula) y punto final parejo. El café no se
  // lista: no es algo que haya que contar. Es solo de presentación; el texto
  // cargado en el panel no se toca.
  const features = (descripcion ?? '')
    .split(/\n|\s\+\s/)
    .map((l) => l.trim())
    .filter((l) => l && !/^caf[eé]([\s.,;:!]|$)/i.test(l))
    .map((l) => l.charAt(0).toUpperCase() + l.slice(1))
    .map((l) => (/[.!?…]$/.test(l) ? l : `${l}.`));
  // Cultural Manso tiene página propia —y su propia sección en el panel—, así
  // que su card sale del detalle genérico y va derecho ahí.
  const detalle = cultural
    ? '/mansocultural'
    : membresia.slug
      ? `/membresias/${membresia.slug}`
      : null;

  return (
    <article
      onMouseEnter={hayFotos ? () => setPasando(true) : undefined}
      onMouseLeave={hayFotos ? () => { setPasando(false); setFoto(0); } : undefined}
      className={`group group/card relative flex w-full h-full min-h-[218px] sm:min-h-[440px] border ${cBorde} ${cFondo} transition-colors duration-300`}
    >
      {hayFotos && (
        <div
          aria-hidden
          className={`absolute inset-0 z-[1] pointer-events-none transition-opacity duration-300 ${pasando ? 'opacity-100' : 'opacity-0'}`}
        >
          {fotos.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt=""
              fill
              loading="eager"
              sizes="(min-width: 1024px) 25vw, 50vw"
              className={`object-cover ${i === foto ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40" />
        </div>
      )}

      {/* El cuerpo de la card lleva al detalle; el botón, directo al formulario.
          Va como capa debajo del contenido en vez de envolverlo porque un
          <button> dentro de un <a> no es HTML válido. */}
      {detalle && (
        <Link href={detalle} className="absolute inset-0 z-0" aria-label={`Ver ${membresia.nombre}`}>
          <span className="sr-only">Ver {membresia.nombre}</span>
        </Link>
      )}

      <div className="relative z-10 flex w-full pointer-events-none">
        <div className="flex-1 flex flex-col min-w-0 p-3 sm:p-6">
          {/* El slot va siempre, con o sin badge: si no, el título de la card
              destacada baja y queda desalineado del de las vecinas. */}
          <span className="h-3 sm:h-4 text-[7px] sm:text-[9px] font-black uppercase tracking-[0.15em] sm:tracking-[0.3em] text-manso-terra group-hover/card:text-manso-cream transition-colors duration-300">
            {membresia.destacado ? 'Más popular' : ''}
          </span>

          {/* `break-words` y no `truncate`: un nombre largo baja de línea, que es
              justo lo que hace la refe con "Half day pass" (y lo que necesita
              "Cultural Manso" para partir en dos líneas sin salirse del
              contenedor). Ana pidió que "x week" salga sin negrita y más
              chico que el resto del nombre, en el mismo renglón (ver
              cards_cowork.jpeg): si el nombre termina en " x week", ese
              sufijo se separa en un span aparte, más chico y sin bold, y sólo
              ese fragmento va con `whitespace-nowrap` para no partirse él
              solo. Desktop -10% del original (2.75rem → 2.5rem). Mobile pasó
              por -10% (15px → 13.5px) y después +10% en mobile solamente,
              pero calculado sobre el original (15px → 16.5px) y no sobre el
              13.5px ya reducido: aplicar el +10% en cadena sobre el valor
              reducido daba apenas 14.85px, casi indistinguible del 13.5px
              anterior y todavía por debajo del original —por eso se veía
              "reducido" en vez de agrandado.
              "FULL 3D x week" (el nombre más largo) no puede quedar como la
              única card con "week" en un renglón aparte: rompía la
              consistencia entre las 4 cards. En vez de dejar que envuelva,
              el título en desktop baja otro toque (2.5rem → 2.25rem, ~10%
              más) para que las cuatro entren siempre en una sola línea con
              `whitespace-nowrap` fijo (ver cards.png). */}
          <h3
            className={`${numeros.className} font-extrabold tracking-[-0.03em] leading-[0.95] text-[16.5px] sm:text-[2.25rem] break-words transition-colors duration-300 ${cText}`}
          >
            {(() => {
              const match = membresia.nombre.match(/^(.*)\s(x week)$/i);
              if (!match) return membresia.nombre;
              const [, resto, xWeek] = match;
              return (
                <span className="whitespace-nowrap">
                  {resto}{' '}
                  <span className="font-normal text-[9px] sm:text-sm align-baseline">{xWeek}</span>
                </span>
              );
            })()}
          </h3>

          {/* Precio centrado en el hueco entre el nombre y las features: grande
              y en negrita, para que la card no quede vacía en el medio.
              Cultural Manso no es un plan y no lleva precio. */}
          <div className="flex flex-col items-center text-center mt-6 sm:mt-12 min-h-[56px] sm:min-h-[96px]">
            {!cultural && (
              <p className={`transition-colors duration-300 ${cText}`}>
                <span className={`${numeros.className} block font-extrabold tracking-[-0.03em] leading-none text-[30px] sm:text-[3.6rem]`}>
                  {precio}
                </span>
                <span className={`block mt-1.5 sm:mt-2 text-[10px] sm:text-sm font-bold uppercase tracking-[0.2em] ${cMuted}`}>
                  / {membresia.periodo}
                </span>
              </p>
            )}
          </div>

          {/* Cada cosa que ofrece el plan, con su bullet. Van justo debajo del
              precio (no pegadas al botón) para que arranquen a la misma altura
              en las tres cards; el punto queda fuera del texto (`flex` + gap)
              para que un renglón largo que baje no se meta bajo el bullet. */}
          {!cultural && features.length > 0 && (
            <ul className={`mt-6 sm:mt-8 space-y-2 text-xs sm:text-base leading-snug text-left transition-colors duration-300 ${cMuted}`}>
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span aria-hidden className="mt-[0.5em] size-1.5 shrink-0 rounded-full bg-current" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-auto pt-6">
            {cultural && descripcion && (
              <p className={`text-xs sm:text-base leading-snug mb-4 sm:mb-6 ${cMuted}`}>{descripcion}</p>
            )}

            {/* SELECCIONAR abre el formulario de inscripción, no el checkout: el
                alta al cowork pasa primero por una solicitud que Ana aprueba.
                Redondo como el resto de los botones del sitio (la cultural también,
                pero en blanco para diferenciarse). La cultural no se solicita: su botón es parte del link que
                envuelve la card, así que va como <span> —un <a> dentro de otro
                <a> no es HTML válido— y el click lo toma la capa de abajo. */}
            {cultural ? (
              <span
                className={`flex items-center justify-center w-full px-[7px] sm:px-[14px] min-h-[32px] sm:min-h-[36px] rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.25em] transition-opacity duration-200 group-hover:opacity-80 ${cBoton}`}
              >
                Conocer más
              </span>
            ) : (
              <button
                type="button"
                data-seleccionar
                onClick={() => setFormAbierto(true)}
                className={`pointer-events-auto flex items-center justify-center w-full px-[7px] sm:px-[14px] min-h-[32px] sm:min-h-[36px] rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.25em] transition-colors duration-300 active:scale-[0.98] ${cBoton}`}
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
