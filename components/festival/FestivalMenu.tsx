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
 * Menú de Basilar: links con ">" en la letra angosta, y TICKETS aparte como
 * bloque de color. En el celular el menú se acomoda en dos renglones y TICKETS
 * pasa a ser un botón fijo abajo a la derecha (salvo en la página de tickets,
 * donde sobra).
 */
export function FestivalMenu() {
  const pathname = usePathname();
  // La página de un artista cuenta como "Line up".
  const actual = (href: string) =>
    href === '/festival' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const enTickets = actual('/festival/tickets');

  return (
    <header className="relative sm:sticky top-0 z-20 bg-[var(--fest-fondo)] flex items-start justify-between gap-4 px-4 sm:px-7 py-3.5 sm:py-[18px]">
      <nav aria-label="Festival">
        <ul className="flex flex-wrap gap-x-3.5 sm:gap-x-[22px] max-w-[760px]">
          {SECCIONES.map(s => (
            <li key={s.href}>
              <Link
                href={s.href}
                aria-current={actual(s.href) ? 'page' : undefined}
                className="fest-angosta fest-flecha text-[19px] sm:text-[22px] leading-[1.05] text-[var(--fest-acento)] hover:text-[var(--fest-texto)] aria-[current=page]:text-[var(--fest-texto)]/55 transition-colors"
              >
                {s.etiqueta}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Link
        href="/festival/tickets"
        className={`fest-angosta shrink-0 bg-[var(--fest-acento)] text-[var(--fest-fondo)] hover:bg-[var(--fest-texto)] transition-colors text-[17px] sm:text-[22px] leading-[1.05] px-[18px] py-2.5 sm:px-3 sm:pt-1 sm:pb-[3px] fixed right-4 bottom-4 z-30 sm:static ${
          enTickets ? 'hidden sm:inline-block' : ''
        }`}
      >
        <span aria-hidden>☞ </span>Tickets
      </Link>
    </header>
  );
}
