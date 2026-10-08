'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import type { EscenarioConArtistas } from '@/lib/festival';
import type { FestivalArtista } from '@/lib/types/festival';

/**
 * Line-up a la soundit.es (la referencia que mandó el equipo): los nombres
 * grandes, en negrita y tal como se cargan en el panel (sin mayúsculas
 * forzadas), uno por renglón. Sin fecha ni lugar por escenario —el festival es
 * un solo día— y sin los símbolos entre nombres, que la referencia tachó. Un
 * B2B va en el mismo renglón: "Kittin b2b mad miran".
 *
 * Al pasar el mouse por un nombre, toda la página cambia de color: cada
 * nombre sortea uno de `COLORES`, distinto del anterior, y al salir del
 * line-up vuelve al del panel. Se pisan las variables `--fest-*` del layout
 * (`data-fest-raiz`), así que el menú y el pie cambian con el fondo. Acento y
 * resalte pasan al color del texto: si no, con el fondo terra el menú (que va
 * en acento) desaparece.
 *
 * Lo usan el home y /blur/line-up.
 */

/** Fondo y texto. La paleta de Manso, en claro y en oscuro. */
const COLORES: [string, string][] = [
  ['#E2532B', '#1C1410'], // terra encendida
  ['#B9B23E', '#1C1410'], // oliva
  ['#FFFCDC', '#1C1410'], // cream
  ['#030044', '#FFFCDC'], // azul Manso
  ['#BC2915', '#FFFCDC'], // terra
  ['#542C1B', '#FFFCDC'], // marrón
  ['#F0A27A', '#1C1410'], // terra lavada
  ['#2F3A1E', '#FFFCDC'], // oliva profundo
];

const VARIABLES = ['--fest-fondo', '--fest-texto', '--fest-acento', '--fest-resalte'] as const;

/** Agrupa los B2B con el artista de arriba: cada grupo es un renglón. */
const renglones = (artistas: FestivalArtista[]) =>
  artistas.reduce<FestivalArtista[][]>((acc, a) => {
    if (a.b2b && acc.length > 0) acc[acc.length - 1].push(a);
    else acc.push([a]);
    return acc;
  }, []);

const raiz = () => document.querySelector<HTMLElement>('[data-fest-raiz]');

/** Vuelve a los colores que puso el layout. */
const volver = (originales: Record<string, string> | null) => {
  const el = raiz();
  if (!el || !originales) return;
  for (const [v, valor] of Object.entries(originales)) el.style.setProperty(v, valor);
};

export function LineupCorrido({ escenarios }: { escenarios: EscenarioConArtistas[] }) {
  const ultimo = useRef(-1);
  /** Los valores que puso el layout, para volver a ellos. */
  const originales = useRef<Record<string, string> | null>(null);

  const pintar = () => {
    const el = raiz();
    if (!el) return;
    originales.current ??= Object.fromEntries(VARIABLES.map(v => [v, el.style.getPropertyValue(v)]));
    // Nunca el mismo dos veces seguidas: se sortea entre los otros.
    const hay = ultimo.current < 0 ? COLORES.length : COLORES.length - 1;
    let i = Math.floor(Math.random() * hay);
    if (ultimo.current >= 0 && i >= ultimo.current) i++;
    ultimo.current = i;
    const [fondo, texto] = COLORES[i];
    el.style.setProperty('--fest-fondo', fondo);
    el.style.setProperty('--fest-texto', texto);
    el.style.setProperty('--fest-acento', texto);
    el.style.setProperty('--fest-resalte', texto);
  };

  const restaurar = () => {
    volver(originales.current);
    ultimo.current = -1;
  };

  // Al tocar un nombre se navega a su página y el layout sigue montado: sin
  // esto, la página del artista quedaría con el último color sorteado.
  useEffect(() => () => volver(originales.current), []);

  return (
    <div className="fest-lineup" onMouseLeave={restaurar}>
      {escenarios.map(escenario => (
        <section key={escenario.id} className="mb-14 sm:mb-20 last:mb-0">
          {escenarios.length > 1 && <h3 className="fest-rotulo mb-5 sm:mb-7">{escenario.nombre}</h3>}
          <ul>
            {renglones(escenario.artistas).map(grupo => (
              <li key={grupo[0].id}>
                {grupo.map((artista, k) => (
                  <span key={artista.id}>
                    {k > 0 && <span className="fest-lineup-b2b"> b2b </span>}
                    <Link href={`/blur/line-up/${artista.slug}`} onMouseEnter={pintar} className="fest-lineup-nombre">
                      {artista.nombre}
                      {artista.pais && (
                        <sup className="fest-mono text-[11px] font-normal tracking-[0.2em] opacity-60 ml-1.5 align-top relative top-[0.6em]">
                          {artista.pais}
                        </sup>
                      )}
                    </Link>
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
