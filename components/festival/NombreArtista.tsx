import Link from 'next/link';
import { FestivalArtista } from '@/lib/types/festival';

/** Un nombre del line-up: link a su página, con el país chiquito arriba a la derecha. */
export function NombreArtista({ artista }: { artista: FestivalArtista }) {
  return (
    <Link
      href={`/festival/line-up/${artista.slug}`}
      className="fest-angostisima inline-block hover:text-[var(--fest-acento)] transition-colors duration-200"
    >
      {artista.nombre}
      {artista.pais && (
        <sup className="fest-mono text-[11px] font-normal tracking-[0.2em] opacity-55 ml-1.5 relative top-[0.8em] align-top">
          {artista.pais}
        </sup>
      )}
    </Link>
  );
}
