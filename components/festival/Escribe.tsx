'use client';

import { Fragment, useEffect, useRef, useState } from 'react';

/** Un pedazo de texto con su clase (para las palabras en color de `TextoResaltado`). */
export interface Trozo {
  texto: string;
  clase?: string;
}

interface Props {
  /** Párrafos, cada uno hecho de trozos. Para un texto suelto, usar `EscribeTexto`. */
  parrafos: Trozo[][];
  /** Clase de cada `<p>`. Sin ella, los párrafos se dibujan como `<span>` (para rótulos). */
  claseParrafo?: string;
  /** Milisegundos por letra. */
  ritmo?: number;
  /** Tope de duración: un texto largo acelera para no tardar más que esto. */
  maximo?: number;
  /** Espera antes de arrancar, una vez visible. */
  retraso?: number;
}

/**
 * Texto que se escribe solo cuando entra en pantalla, letra por letra y con un
 * cursor. El texto entero está en el DOM desde el principio, con lo que falta
 * transparente: el bloque ocupa desde el arranque lo mismo que al final (nada
 * salta) y los lectores de pantalla y el buscador lo leen completo. Con
 * "reducir movimiento" aparece de una.
 */
export function Escribe({ parrafos, claseParrafo, ritmo = 22, maximo = 2600, retraso = 0 }: Props) {
  const ref = useRef<HTMLElement>(null);
  const total = parrafos.reduce((acc, p) => acc + p.reduce((a, t) => a + t.texto.length, 0), 0);
  const [letras, setLetras] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setLetras(total);
      return;
    }
    const porLetra = Math.min(ritmo, maximo / Math.max(total, 1));
    let cuadro = 0;
    let espera = 0;

    const arrancar = () => {
      const inicio = performance.now();
      const paso = (ahora: number) => {
        const n = Math.min(total, Math.floor((ahora - inicio) / porLetra));
        setLetras(n);
        if (n < total) cuadro = requestAnimationFrame(paso);
      };
      cuadro = requestAnimationFrame(paso);
    };

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        observador.disconnect();
        espera = window.setTimeout(arrancar, retraso);
      },
      { threshold: 0.15 }
    );
    observador.observe(el);
    return () => {
      observador.disconnect();
      clearTimeout(espera);
      cancelAnimationFrame(cuadro);
    };
  }, [total, ritmo, maximo, retraso]);

  // Cuántas letras ya escritas le tocan a cada trozo, y en cuál va el cursor
  // (el primero que no está completo).
  const visibles: number[][] = [];
  let resto = letras;
  for (const trozos of parrafos) {
    visibles.push(
      trozos.map(t => {
        const n = Math.max(0, Math.min(t.texto.length, resto));
        resto -= n;
        return n;
      })
    );
  }
  const cursorEn = letras >= total ? null : visibles.flat().findIndex((n, i) => n < parrafos.flat()[i].texto.length);

  // Con párrafos, un div que los contiene; un rótulo va en línea dentro de su <p>.
  const Caja = claseParrafo ? 'div' : 'span';
  const Parrafo = claseParrafo ? 'p' : 'span';
  let indice = 0;

  return (
    <Caja ref={ref as React.Ref<HTMLDivElement & HTMLSpanElement>}>
      {parrafos.map((trozos, i) => (
        <Parrafo key={i} className={claseParrafo}>
          {trozos.map((t, k) => {
            const n = visibles[i][k];
            const conCursor = indice++ === cursorEn;
            return (
              <Fragment key={k}>
                <span className={t.clase}>
                  {t.texto.slice(0, n)}
                  {conCursor && <span aria-hidden className="fest-cursor" />}
                  <span className="opacity-0">{t.texto.slice(n)}</span>
                </span>
              </Fragment>
            );
          })}
        </Parrafo>
      ))}
    </Caja>
  );
}

/** Atajo para un texto de un renglón (rótulos, títulos). */
export function EscribeTexto({ texto, ritmo = 45, retraso }: { texto: string; ritmo?: number; retraso?: number }) {
  return <Escribe parrafos={[[{ texto }]]} ritmo={ritmo} maximo={1200} retraso={retraso} />;
}
