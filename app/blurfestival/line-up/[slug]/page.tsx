import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { leerConfig, leerLineup } from '@/lib/festival';
import Image from 'next/image';
import { VisorFotos } from '@/components/festival/VisorFotos';
import { leerTextos } from '@/lib/festival-idioma-servidor';
import { MARCA_SEO } from '@/lib/festival-seo';
import { descripcion, og } from '@/lib/seo';
import { TituloAncho } from '@/components/festival/TituloAncho';

/**
 * Página de un artista. Estructura de /speakers/[slug] de la bitconf: volver,
 * retrato, nombre, origen, una franja con día/horario, bio, video y redes.
 * Abajo, anterior y siguiente para recorrer el line-up sin volver.
 *
 * La foto va al natural: entera, sin el marco de copia revelada ni el filtro
 * sepia que tenía, y se amplía al tocarla. El escenario salió de la franja
 * (pedido del equipo): ya se lee en el line-up.
 *
 * Se busca dentro del line-up visible (y no en la tabla directo) para que un
 * artista oculto, o de un escenario oculto, dé 404 igual que en el listado.
 */
const buscar = async (slug: string) => {
  const lineup = await leerLineup();
  const todos = lineup.flatMap(e => e.artistas.map(a => ({ ...a, escenario: e.nombre })));
  const i = todos.findIndex(a => a.slug === slug);
  if (i === -1) return null;
  return { artista: todos[i], anterior: todos[i - 1] ?? null, siguiente: todos[i + 1] ?? null };
};

/** Id de un link de YouTube en cualquiera de sus formas (watch, youtu.be, shorts, embed, live). */
const idYoutube = (url: string | null) =>
  url?.match(/(?:youtu\.be\/|[?&]v=|\/(?:embed|shorts|live)\/)([\w-]{11})/)?.[1] ?? null;

/** Acepta el usuario suelto o el link entero, como lo pegue Ana. */
const link = (valor: string | null, base: string) => {
  const v = valor?.trim();
  if (!v) return null;
  return /^https?:\/\//.test(v) ? v : `${base}${v.replace(/^@/, '')}`;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const encontrado = await buscar(slug);
  if (!encontrado) return {};
  const { artista } = encontrado;
  return {
    title: artista.nombre,
    description: descripcion(artista.bio) ?? artista.origen ?? undefined,
    // Next reemplaza el openGraph del layout: sin `og()` se perdería el resto.
    openGraph: og({
      title: `${artista.nombre} — ${MARCA_SEO}`,
      ...(artista.foto_url && { images: [artista.foto_url] }),
    }),
  };
}

export default async function FestivalArtistaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [config, encontrado, { t }] = await Promise.all([leerConfig(), buscar(slug), leerTextos()]);
  if (!config || !encontrado) notFound();

  const { artista, anterior, siguiente } = encontrado;
  const video = idYoutube(artista.youtube_url);
  // La galería: `fotos` en orden, y si no hay (datos viejos) la foto suelta.
  const fotos = artista.fotos?.length ? artista.fotos : artista.foto_url ? [artista.foto_url] : [];

  // El video va debajo de la bio, a todo el ancho de la columna (como en KNDR).
  const videoEl = video && (
    <div className="aspect-video bg-[var(--fest-texto)]/[0.06]">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${video}?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&color=white`}
        title={t.lineup.youtube(artista.nombre)}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );

  const set = [
    [t.lineup.dia, artista.dia],
    [t.lineup.set, artista.horario],
  ].filter((d): d is [string, string] => Boolean(d[1]));

  const redes = [
    ['Instagram', link(artista.instagram, 'https://instagram.com/')],
    ['SoundCloud', link(artista.soundcloud, 'https://soundcloud.com/')],
    ['Resident Advisor', link(artista.resident_advisor, 'https://ra.co/dj/')],
  ].filter((r): r is [string, string] => Boolean(r[1]));

  return (
    <div className="px-4 sm:px-7 pt-6 sm:pt-10 pb-20 sm:pb-24 fest-entra">
      <Link
        href="/blurfestival/line-up"
        className="fest-angosta text-base opacity-55 hover:opacity-100 hover:text-[var(--fest-acento)] transition"
      >
        {t.lineup.todo}
      </Link>

      <div
        className={`mt-8 grid gap-9 md:gap-14 items-start ${
          fotos.length ? 'md:grid-cols-[minmax(220px,380px)_1fr]' : ''
        }`}
      >
        {fotos.length > 0 && (
          <VisorFotos fotos={fotos} alt={artista.nombre} className="flex flex-col gap-4 w-full max-w-[300px] md:max-w-none">
            {fotos.map((foto, i) => (
              <button key={`${foto}-${i}`} type="button" data-foto={i} aria-label={t.lineup.ampliar(artista.nombre)} className="block w-full cursor-zoom-in">
                <Image
                  src={foto}
                  alt={artista.nombre}
                  width={0}
                  height={0}
                  sizes="(min-width: 768px) 380px, 300px"
                  priority={i === 0}
                  className="block w-full h-auto"
                />
              </button>
            ))}
          </VisorFotos>
        )}

        <div className="min-w-0">
          <TituloAncho texto={artista.nombre} className="text-[clamp(2.6rem,7.5vw,7.5rem)]" />

          {(artista.origen || artista.pais) && (
            <p className="mt-3.5 fest-mono text-[13px] tracking-[0.2em] uppercase text-[var(--fest-resalte)]">
              {artista.origen || artista.pais}
            </p>
          )}

          {set.length > 0 && (
            <dl className="mt-8 inline-flex flex-wrap border border-[var(--fest-texto)]/15">
              {set.map(([etiqueta, valor]) => (
                <div
                  key={etiqueta}
                  className="px-5 py-3.5 border-r border-[var(--fest-texto)]/15 last:border-r-0"
                >
                  <dt className="fest-mono text-[10px] tracking-[0.3em] uppercase opacity-55">{etiqueta}</dt>
                  <dd className="fest-angosta text-xl mt-1">{valor}</dd>
                </div>
              ))}
            </dl>
          )}

          {artista.bio && (
            <p className="mt-8 max-w-[62ch] text-[clamp(17px,1.5vw,21px)] leading-[1.6] opacity-85 whitespace-pre-line">
              {artista.bio}
            </p>
          )}

          {video && <div className="mt-8 max-w-[720px]">{videoEl}</div>}

          {redes.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-x-[22px] gap-y-2">
              {redes.map(([nombre, href]) => (
                <a
                  key={nombre}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fest-angosta fest-flecha text-lg text-[var(--fest-acento)] hover:text-[var(--fest-texto)] transition-colors"
                >
                  {nombre}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {(anterior || siguiente) && (
        <nav
          aria-label={t.lineup.otros}
          className="mt-16 pt-5 border-t border-[var(--fest-texto)]/15 flex justify-between gap-5"
        >
          {anterior ? (
            <Link
              href={`/blurfestival/line-up/${anterior.slug}`}
              className="fest-angosta text-[clamp(20px,2.4vw,32px)] leading-tight hover:text-[var(--fest-acento)] transition-colors"
            >
              <small className="block fest-mono text-[10px] tracking-[0.3em] font-normal opacity-55">{t.lineup.anterior}</small>
              {anterior.nombre}
            </Link>
          ) : (
            <span />
          )}
          {siguiente && (
            <Link
              href={`/blurfestival/line-up/${siguiente.slug}`}
              className="fest-angosta text-right text-[clamp(20px,2.4vw,32px)] leading-tight hover:text-[var(--fest-acento)] transition-colors"
            >
              <small className="block fest-mono text-[10px] tracking-[0.3em] font-normal opacity-55">{t.lineup.siguiente}</small>
              {siguiente.nombre}
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
