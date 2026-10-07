'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const SECCIONES = [
  { href: '/festival', etiqueta: 'Home' },
  { href: '/festival/vision', etiqueta: 'Visión' },
  { href: '/festival/locacion', etiqueta: 'Locación' },
  { href: '/festival/line-up', etiqueta: 'Line up' },
  { href: '/festival/tickets', etiqueta: 'Tickets' },
  { href: '/festival/info', etiqueta: 'Info & FAQ' },
] as const;

/**
 * Menú de Basilar (ver `.fest-menu` en festival.css), un poco más chico que
 * el original —18px en vez de 23,3 y menos aire— porque ocupaba demasiado:
 * links con chevron, y TICKETS aparte como bloque de color, sin la manito. En el celular el menú se acomoda en dos renglones y TICKETS
 * pasa a ser un botón fijo abajo a la derecha (salvo en la página de tickets,
 * donde sobra).
 *
 * Movimiento (festival.css): los links entran escalonados al cargar, el chevron
 * avanza y una línea se dibuja debajo al pasar el mouse, y un brillo cruza
 * TICKETS cada tanto. Nada de esto corre con "reducir movimiento".
 */
export function FestivalMenu() {
  const pathname = usePathname();
  // La página de un artista cuenta como "Line up".
  const actual = (href: string) =>
    href === '/festival' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const enTickets = actual('/festival/tickets');

  return (
    <header className="relative sm:sticky top-0 z-20 bg-[var(--fest-fondo)] flex items-start justify-between gap-4 px-4 py-3 sm:px-5 sm:py-4">
      <nav aria-label="Festival">
        <ul className="flex flex-wrap gap-x-[0.45em] fest-menu leading-none text-[14px] sm:text-[18px]">
          {SECCIONES.map((s, i) => (
            <li key={s.href} className="fest-menu-entra" style={{ '--i': i } as React.CSSProperties}>
              <Link
                href={s.href}
                aria-current={actual(s.href) ? 'page' : undefined}
                className="fest-chevron fest-menu-link pb-[0.1em] text-[var(--fest-acento)] hover:text-[var(--fest-texto)] aria-[current=page]:text-[var(--fest-texto)]/55 transition-colors"
              >
                {s.etiqueta}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Link
        href="/festival/tickets"
        style={{ '--i': SECCIONES.length } as React.CSSProperties}
        className={`fest-menu fest-menu-entra fest-brillo shrink-0 bg-[var(--fest-acento)] text-[var(--fest-fondo)] hover:bg-[var(--fest-texto)] transition-colors text-[16px] sm:text-[17px] leading-[1.3] px-[0.26em] py-2 sm:py-0 fixed right-4 bottom-4 z-30 sm:relative sm:right-auto sm:bottom-auto overflow-hidden ${
          enTickets ? 'hidden sm:inline-block' : ''
        }`}
      >
        Tickets
      </Link>
    </header>
  );
}
