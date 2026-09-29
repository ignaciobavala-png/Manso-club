import { Cormorant_Garamond, IBM_Plex_Mono } from 'next/font/google';
import '@/components/festival/festival.css';

/**
 * Tipografía propia del festival, cargada solo en /festival: no es Manso.
 * Dos voces: una serif clásica y fina para el nombre y los artistas —va con la
 * geometría sagrada del hero— y una mono chica para todo lo informativo.
 */
const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  variable: '--font-fest-display',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-fest-mono',
});

export default function FestivalLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${display.variable} ${mono.variable}`}>{children}</div>;
}
