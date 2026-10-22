'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PASOS_RECORRIDO } from '@/lib/recorrido';

const EASE = 'ease-[cubic-bezier(0.32,0.72,0,1)]';

type Item =
  | { tipo: 'foto'; paso: number }
  | { tipo: 'clip'; desde: number; src: string };

/**
 * El recorrido: una foto sticky a pantalla completa y, encima, un bloque de
 * texto por paso que scrollea. Entre algunos pasos hay un tramo sin texto en el
 * que corre un clip (IA) que va de una foto real a la siguiente. El ítem activo
 * es el que cruza la mitad de la pantalla (IntersectionObserver, sin listener
 * de scroll) y fija qué se ve en el escenario.
 */
export function RecorridoViaje() {
  const pasos = PASOS_RECORRIDO;
  const items = useMemo<Item[]>(
    () =>
      pasos.flatMap((p, i) => {
        const lista: Item[] = [{ tipo: 'foto', paso: i }];
        if (p.clipDespues && i < pasos.length - 1) lista.push({ tipo: 'clip', desde: i, src: p.clipDespues });
        return lista;
      }),
    [pasos],
  );

  const [activo, setActivo] = useState(0);
  // Cuánto se avanzó como máximo: las fotos se montan de a poco, no las 14 de golpe.
  const [maximo, setMaximo] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const videos = useRef<Record<number, HTMLVideoElement | null>>({});

  useEffect(() => {
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          const i = Number((e.target as HTMLElement).dataset.item);
          setActivo(i);
          setMaximo((m) => Math.max(m, i));
        }
      },
      // Una banda finita en el centro: siempre cruza exactamente un ítem.
      { rootMargin: '-45% 0px -45% 0px' },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const itemActivo = items[activo];
  const fotoActiva = itemActivo.tipo === 'foto' ? itemActivo.paso : itemActivo.desde;
  const pasoVisible = itemActivo.tipo === 'foto' ? itemActivo.paso : -1;

  // El clip arranca desde el principio cada vez que se entra a su tramo.
  useEffect(() => {
    if (itemActivo.tipo !== 'clip') return;
    const v = videos.current[activo];
    if (!v) return;
    v.currentTime = 0;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) v.play().catch(() => {});
  }, [activo, itemActivo]);

  // El máximo se cuenta en ítems; las fotos se montan por número de paso.
  const pasoMaximo = items[maximo].tipo === 'foto' ? items[maximo].paso : items[maximo].desde + 1;
  const montada = (paso: number) => paso <= pasoMaximo + 2;

  return (
    <section aria-label="Recorrido por Manso" className="relative bg-manso-black">
      {/* Escenario fijo */}
      <div className="sticky top-0 h-svh w-full overflow-hidden" aria-hidden="true">
        {/* Fondo desenfocado, solo en pantallas anchas donde la foto no llena */}
        <div className="absolute inset-0 hidden md:block">
          {pasos.map((p, i) =>
            montada(i) ? (
              <img
                key={p.foto}
                src={p.foto}
                alt=""
                loading="lazy"
                decoding="async"
                className={`absolute inset-0 h-full w-full scale-125 object-cover blur-3xl transition-opacity duration-1000 ${EASE} ${
                  i === fotoActiva ? 'opacity-40' : 'opacity-0'
                }`}
              />
            ) : null,
          )}
        </div>

        {/* Marco: pantalla completa en celular, columna vertical en escritorio */}
        <div className="absolute inset-0 md:inset-auto md:right-[8vw] md:top-1/2 md:h-[88svh] md:-translate-y-1/2 md:aspect-[738/1600] md:overflow-hidden md:rounded-2xl">
          {pasos.map((p, i) =>
            montada(i) ? (
              <img
                key={p.foto}
                src={p.foto}
                alt=""
                loading="lazy"
                decoding="async"
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ${EASE} ${
                  i === pasoVisible ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
                }`}
              />
            ) : null,
          )}
          {items.map((it, k) =>
            it.tipo === 'clip' && montada(it.desde + 1) ? (
              <video
                key={it.src}
                ref={(el) => {
                  videos.current[k] = el;
                }}
                src={it.src}
                muted
                playsInline
                preload="auto"
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${EASE} ${
                  k === activo ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ) : null,
          )}
          {/* En celular el texto va encima de la foto: un velo plano para que se lea */}
          <div className="absolute inset-0 bg-manso-black/25 md:hidden" />
        </div>
      </div>

      {/* Ítems: texto que scrollea por encima del escenario */}
      <div className="relative z-10 -mt-[100svh]">
        {items.map((it, k) =>
          it.tipo === 'clip' ? (
            // Tramo de viaje: sin texto, solo scroll mientras corre el clip
            <div
              key={it.src}
              ref={(el) => {
                refs.current[k] = el;
              }}
              data-item={k}
              className="h-[70svh]"
            />
          ) : (
            <div
              key={pasos[it.paso].foto}
              ref={(el) => {
                refs.current[k] = el;
              }}
              data-item={k}
              data-paso={it.paso}
              className="flex h-[80svh] items-end px-4 pb-16 md:items-center md:px-0 md:pb-0 md:pl-[8vw]"
            >
              <article
                aria-current={k === activo ? 'step' : undefined}
                className={`w-full rounded-xl bg-manso-black/70 p-4 backdrop-blur-xl transition-all duration-700 ${EASE} md:w-[min(28rem,38vw)] md:rounded-none md:bg-transparent md:p-0 md:backdrop-blur-none ${
                  k === activo ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-8 opacity-0 blur-sm'
                }`}
              >
                <p className="text-sm text-manso-cream/60">
                  {String(it.paso + 1).padStart(2, '0')} / {String(pasos.length).padStart(2, '0')}
                </p>
                <h2 className="mt-2 text-4xl font-bold text-manso-cream md:text-5xl [text-wrap:balance]">
                  {pasos[it.paso].titulo}
                </h2>
                <p className="mt-3 text-base text-manso-cream/80 md:text-lg [text-wrap:pretty]">
                  {pasos[it.paso].texto}
                </p>
                {/* La foto del escenario es decorativa para lectores de pantalla; su descripción va acá */}
                <span className="sr-only">Foto: {pasos[it.paso].alt}</span>
              </article>
            </div>
          ),
        )}
      </div>
    </section>
  );
}
