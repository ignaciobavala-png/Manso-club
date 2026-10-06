import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { leerConfig, leerLineup } from '@/lib/festival';
import { FestivalArtista } from '@/lib/types/festival';
import { NombreArtista } from '@/components/festival/NombreArtista';

export const metadata: Metadata = { title: 'Line up' };

/** Corrimiento de cada renglón, en %: el line-up se lee en escalera, no en bloque. */
const CORRIMIENTOS = [0, 30, 9, 44, 18, 4, 36, 12, 52, 24];

/** Agrupa los B2B con el artista de arriba: cada grupo es un renglón. */
const renglones = (artistas: FestivalArtista[]) =>
  artistas.reduce<FestivalArtista[][]>((acc, a) => {
    if (a.b2b && acc.length > 0) acc[acc.length - 1].push(a);
    else acc.push([a]);
    return acc;
  }, []);

export default async function FestivalLineup() {
  const [config, lineup] = await Promise.all([leerConfig(), leerLineup()]);
  if (!config) notFound();

  return (
    <div className="px-4 sm:px-7 pt-6 sm:pt-10 pb-20 sm:pb-24 fest-entra">
      {lineup.length === 0 ? (
        <>
          <p className="fest-rotulo mb-8">Line up</p>
          <p className="fest-mono text-sm opacity-60">El line-up se anuncia pronto.</p>
        </>
      ) : (
        lineup.map((escenario, e) => (
          <section key={escenario.id} className="mb-20 last:mb-0">
            <h2 className="fest-rotulo mb-8">{escenario.nombre}</h2>
            <ul>
              {renglones(escenario.artistas).map((grupo, i) => {
                const off = CORRIMIENTOS[(i + e * 3) % CORRIMIENTOS.length];
                return (
                  <li
                    key={grupo[0].id}
                    // Un B2B ocupa el doble: se corre menos para que entre en un renglón.
                    style={{ '--off': `${grupo.length > 1 ? Math.min(off, 12) : off}%` } as React.CSSProperties}
                    className="leading-[0.98] text-[clamp(2.2rem,11vw,3.4rem)] sm:text-[clamp(2.6rem,7.2vw,6.6rem)] pl-[calc(var(--off)*0.4)] md:pl-[var(--off)] md:whitespace-nowrap"
                  >
                    {grupo.map((artista, k) => (
                      <span key={artista.id}>
                        {k > 0 && (
                          <span className="fest-mono block md:inline text-[clamp(11px,1.1vw,14px)] tracking-[0.25em] text-[var(--fest-resalte)] md:mx-3.5 my-0.5 md:my-0 align-middle">
                            B2B
                          </span>
                        )}
                        <NombreArtista artista={artista} />
                      </span>
                    ))}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
