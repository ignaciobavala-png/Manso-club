'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PASOS_RECORRIDO } from '@/lib/recorrido';

const EASE = 'ease-[cubic-bezier(0.32,0.72,0,1)]';

type Item =
  | { tipo: 'foto'; paso: number }
  | { tipo: 'clip'; desde: number; src: string }
  | { tipo: 'cierre' };

/**
 * Recorrido en primera persona. La pantalla es el recorrido: una foto sticky a
 * pantalla completa y, debajo, tramos que scrollean. El scroll es caminar:
 *  - en una foto, un empujón lento hacia adelante;
 *  - en un clip (IA, de una foto real a la siguiente), el video avanza cuadro
 *    a cuadro con el scroll, 1 a 1, no se reproduce solo.
 * El ítem activo es el que cruza la mitad de la pantalla (IntersectionObserver);
 * el avance dentro de él lo mide un listener pasivo con rAF, porque es el efecto
 * central de la página.
 */
export function RecorridoViaje() {
  const pasos = PASOS_RECORRIDO;
  const items = useMemo<Item[]>(
    () => [
      ...pasos.flatMap((p, i): Item[] => {
        const lista: Item[] = [{ tipo: 'foto', paso: i }];
        if (p.clipDespues && i < pasos.length - 1) lista.push({ tipo: 'clip', desde: i, src: p.clipDespues });
        return lista;
      }),
      { tipo: 'cierre' },
    ],
    [pasos],
  );

  const [activo, setActivo] = useState(0);
  // Cuánto se avanzó como máximo: las fotos se montan de a poco, no las 14 de golpe.
  const [maximo, setMaximo] = useState(0);
  const seccion = useRef<HTMLElement>(null);
  const escenario = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const videos = useRef<Record<number, HTMLVideoElement | null>>({});
  const activoRef = useRef(0);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          const i = Number((e.target as HTMLElement).dataset.item);
          activoRef.current = i;
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

  // Avance dentro del ítem activo (--p) y del recorrido entero (--total).
  useEffect(() => {
    let pedido = 0;
    let ultimoTiempo = -1;
    const medir = () => {
      pedido = 0;
      const esc = escenario.current;
      const sec = seccion.current;
      const bloque = refs.current[activoRef.current];
      if (!esc || !sec || !bloque) return;
      const vh = window.innerHeight;
      const r = bloque.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh / 2 - r.top) / r.height));
      esc.style.setProperty('--p', p.toFixed(4));
      const s = sec.getBoundingClientRect();
      const total = Math.min(1, Math.max(0, -s.top / Math.max(1, s.height - vh)));
      esc.style.setProperty('--total', total.toFixed(4));

      const v = videos.current[activoRef.current];
      if (v && v.duration) {
        const t = p * v.duration;
        // Un solo seek por cambio apreciable: más fino que un cuadro no se ve.
        if (Math.abs(t - ultimoTiempo) > 0.02) {
          v.currentTime = t;
          ultimoTiempo = t;
        }
      }
    };
    const alScrollear = () => {
      if (!pedido) pedido = requestAnimationFrame(medir);
    };
    medir();
    addEventListener('scroll', alScrollear, { passive: true });
    addEventListener('resize', alScrollear);
    return () => {
      removeEventListener('scroll', alScrollear);
      removeEventListener('resize', alScrollear);
      if (pedido) cancelAnimationFrame(pedido);
    };
  }, []);

  const itemActivo = items[activo];
  const ultimo = pasos.length - 1;
  const fotoActiva =
    itemActivo.tipo === 'foto' ? itemActivo.paso : itemActivo.tipo === 'clip' ? itemActivo.desde : ultimo;
  const fotoVisible = itemActivo.tipo === 'clip' ? -1 : fotoActiva;

  // El máximo se cuenta en ítems; las fotos se montan por número de paso.
  const mx = items[maximo];
  const pasoMaximo = mx.tipo === 'foto' ? mx.paso : mx.tipo === 'clip' ? mx.desde + 1 : ultimo;
  const montada = (paso: number) => paso <= pasoMaximo + 2;

  return (
    <section ref={seccion} aria-label="Recorrido por Manso" className="relative bg-manso-black">
      {/* Escenario fijo: la foto o el clip ocupan la pantalla */}
      <div
        ref={escenario}
        className="sticky top-0 h-svh w-full overflow-hidden"
        style={{ ['--p' as string]: 0, ['--total' as string]: 0 }}
        aria-hidden="true"
      >
        {/* Fondo desenfocado: solo en escritorio, donde la foto vertical no llena el ancho */}
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

        {/* Marco: pantalla completa en celular; en escritorio, alto completo y centrado */}
        <div className="absolute inset-0 md:inset-auto md:left-1/2 md:top-0 md:h-svh md:-translate-x-1/2 md:aspect-[0.62] md:overflow-hidden">
          {pasos.map((p, i) =>
            montada(i) ? (
              <img
                key={p.foto}
                src={p.foto}
                alt=""
                loading="lazy"
                decoding="async"
                style={{
                  // Empujón hacia adelante mientras se camina por esta foto; las que
                  // ya quedaron atrás se quedan en su punto final para no dar un salto.
                  transform:
                    i === fotoVisible
                      ? 'scale(calc(1 + var(--p) * 0.07))'
                      : i < fotoActiva
                        ? 'scale(1.07)'
                        : 'scale(1)',
                }}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${EASE} motion-reduce:!transform-none ${
                  i === fotoVisible ? 'opacity-100' : 'opacity-0'
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
                tabIndex={-1}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${EASE} ${
                  k === activo ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ) : null,
          )}
        </div>

        {/* Avance del recorrido entero */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-manso-cream/20">
          <div
            className="h-full origin-left bg-manso-cream"
            style={{ transform: 'scaleX(var(--total))' }}
          />
        </div>
      </div>

      {/* Tramos: lo que scrollea por encima del escenario */}
      <div className="relative z-10 -mt-[100svh]">
        {items.map((it, k) => {
          if (it.tipo === 'clip') {
            // Tramo de caminata: sin texto, el scroll mueve el clip
            return (
              <div
                key={it.src}
                ref={(el) => {
                  refs.current[k] = el;
                }}
                data-item={k}
                className="h-[150svh]"
              />
            );
          }

          if (it.tipo === 'cierre') {
            return (
              <div
                key="cierre"
                ref={(el) => {
                  refs.current[k] = el;
                }}
                data-item={k}
                className="flex h-svh items-center px-4 md:justify-center md:px-0"
              >
                <div
                  className={`w-full rounded-xl bg-manso-black/80 p-6 transition-all duration-700 ${EASE} md:w-[min(28rem,90vw)] ${
                    k === activo ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                  }`}
                >
                  <h2 className="text-4xl font-bold text-manso-cream [text-wrap:balance]">Ahora falta que vengas</h2>
                  <p className="mt-3 text-base text-manso-cream/80 [text-wrap:pretty]">
                    Mirá los planes del cowork y sumate a la mesa larga.
                  </p>
                  <Link
                    href="/membresias"
                    className={`mt-6 inline-flex items-center rounded-full bg-manso-cream px-6 py-3 text-base font-semibold text-manso-black transition-all duration-700 ${EASE} hover:scale-105 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-manso-cream`}
                  >
                    Ver membresías
                  </Link>
                </div>
              </div>
            );
          }

          const p = pasos[it.paso];
          return (
            <div
              key={p.foto}
              ref={(el) => {
                refs.current[k] = el;
              }}
              data-item={k}
              className="flex h-[110svh] items-start px-4 pt-[calc(100svh-9rem)] md:items-start md:justify-center md:px-0"
            >
              <article
                aria-current={k === activo ? 'step' : undefined}
                className={`w-full rounded-xl bg-manso-black/75 p-4 transition-all duration-700 ${EASE} md:w-[min(30rem,90vw)] ${
                  k === activo ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}
              >
                <p className="text-sm text-manso-cream/60">
                  {String(it.paso + 1).padStart(2, '0')} / {String(pasos.length).padStart(2, '0')}
                  {it.paso === 0 ? ' · Scrolleá para caminar' : ''}
                </p>
                {it.paso === 0 ? (
                  <h1 className="mt-1 text-3xl font-bold text-manso-cream [text-wrap:balance]">{p.titulo}</h1>
                ) : (
                  <h2 className="mt-1 text-3xl font-bold text-manso-cream [text-wrap:balance]">{p.titulo}</h2>
                )}
                <p className="mt-2 text-base text-manso-cream/80 [text-wrap:pretty]">{p.texto}</p>
                {/* La foto del escenario es decorativa para lectores de pantalla; su descripción va acá */}
                <span className="sr-only">Foto: {p.alt}</span>
              </article>
            </div>
          );
        })}
      </div>
    </section>
  );
}
