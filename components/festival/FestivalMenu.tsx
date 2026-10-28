'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SelectorIdioma, useTextos } from '@/components/festival/Idioma';

/** Las etiquetas salen de `TEXTOS[idioma].menu`, indexadas por href. */
export const SECCIONES = [
  '/blur',
  '/blur/vision',
  '/blur/locacion',
  '/blur/spots',
  '/blur/line-up',
  '/blur/tickets',
  '/blur/info',
] as const;

/**
 * Menú de Basilar (ver `.fest-menu` en festival.css), un poco más chico que
 * el original —18px en vez de 23,3 y menos aire— porque ocupaba demasiado:
 * links con chevron, y TICKETS aparte como bloque de color, sin la manito. En el celular va a 16px
 * (a 14 quedaba chico) y se acomoda en dos o tres renglones; TICKETS
 * pasa a ser un botón fijo abajo a la derecha (salvo en la página de tickets,
 * donde sobra).
 *
 * Movimiento (festival.css): los links entran escalonados al cargar, el chevron
 * avanza y una línea se dibuja debajo al pasar el mouse, y un brillo cruza
 * TICKETS cada tanto. Nada de esto corre con "reducir movimiento".
 */
export function FestivalMenu() {
  const pathname = usePathname();
  const t = useTextos();
  // La página de un artista cuenta como "Line up".
  const actual = (href: string) =>
    href === '/blur' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const enTickets = actual('/blur/tickets');

  return (
    <header className="relative sm:sticky top-0 z-20 bg-[var(--fest-fondo)] flex items-start justify-between gap-4 px-4 py-3 sm:px-5 sm:py-4">
      <nav aria-label="Festival">
        <ul className="flex flex-wrap gap-x-[0.45em] fest-menu leading-none text-[16px] sm:text-[18px]">
          {SECCIONES.map((href, i) => (
            <li key={href} className="fest-menu-entra" style={{ '--i': i } as React.CSSProperties}>
              <Link
                href={href}
                aria-current={actual(href) ? 'page' : undefined}
                className="fest-chevron fest-menu-link pb-[0.1em] text-[var(--fest-acento)] hover:text-[var(--fest-texto)] aria-[current=page]:text-[var(--fest-texto)]/55 transition-colors"
              >
                {t.menu[href]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex items-start gap-5 shrink-0">
      <SelectorIdioma />
      <Link
        href="/blur/tickets"
        style={{ '--i': SECCIONES.length } as React.CSSProperties}
        className={`fest-menu fest-menu-entra fest-brillo shrink-0 bg-[var(--fest-acento)] text-[var(--fest-fondo)] hover:bg-[var(--fest-texto)] transition-colors text-[18px] sm:text-[17px] leading-[1.3] px-[0.26em] py-2 sm:py-0 fixed right-4 bottom-4 z-30 sm:relative sm:right-auto sm:bottom-auto overflow-hidden ${
          enTickets ? 'hidden sm:inline-block' : ''
        }`}
      >
        {t.menu['/blur/tickets']}
      </Link>
      </div>
    </header>
  );
}
