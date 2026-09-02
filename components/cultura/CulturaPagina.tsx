import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CulturaBanner, CulturaBloque } from '@/lib/types/cultura';

/** Solo lo que la página dibuja. El panel usa las filas completas; acá alcanza
 *  con esto, y así la vista previa del admin puede pasar borradores. */
export type BannerVista = Pick<CulturaBanner, 'id' | 'imagen_url' | 'titulo' | 'subtitulo'>;
export type BloqueVista = Pick<
  CulturaBloque,
  'id' | 'texto' | 'foto_izquierda_url' | 'foto_derecha_url'
>;

interface Props {
  titulo: string;
  intro?: string | null;
  banners: BannerVista[];
  bloques: BloqueVista[];
}

/**
 * Alturas de las bandas horizontales. La refe (verci.com/satellite) tiene la
 * del medio bastante más alta que las de los extremos; el patrón se repite cada
 * tres para que la página aguante más de tres banners sin quedar plana.
 */
const ALTURA_BANNER = ['h-[42vh]', 'h-[62vh]', 'h-[42vh]'];

/**
 * Dispersión de las fotos que rodean cada bloque de texto. Ana carga foto y
 * texto; el desparramo —ancho de cada foto y cuánto sube o baja— sale de la
 * posición del bloque, así no tiene que acomodar nada a mano.
 *
 * El desplazamiento va con `translate-y`, que no ocupa espacio: por eso las
 * fotos pueden montarse sobre el bloque vecino sin empujar el layout.
 */
const DISPERSION = [
  { izq: 'w-[82%] translate-y-4', der: 'w-full -translate-y-12' },
  { izq: 'w-full translate-y-16 ml-auto', der: 'w-[80%] translate-y-6' },
  { izq: 'w-[86%] -translate-y-8', der: 'w-full translate-y-20' },
];

const Foto = ({ src, className }: { src: string; className: string }) => (
  // Sin next/image: son fotos que sube Ana a Storage y el tamaño acá es
  // porcentual, no fijo — no hay un `sizes` sensato que dar.
  <img
    src={src}
    alt=""
    className={`block object-cover aspect-[4/3] ${className}`}
  />
);

/**
 * La página de /mansocultural. Ana pidió copiar la refe de verci: arriba las
 * bandas horizontales con el texto encima, y debajo las frases centradas con
 * fotos desparramadas a los costados.
 *
 * Es la misma plantilla que se usa en la vista previa del panel, así que lo que
 * Ana ve mientras edita es exactamente lo que se publica.
 */
export const CulturaPagina = ({ titulo, intro, banners, bloques }: Props) => {
  return (
    <main className="min-h-screen bg-manso-black text-manso-cream">
      <div className="max-w-5xl mx-auto px-6 md:px-12 pt-28 md:pt-32">
        <Link
          href="/membresias"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-manso-cream/60 hover:text-manso-cream transition-colors"
        >
          <ArrowLeft size={14} />
          Membresías
        </Link>

        <h1 className="mt-10 font-montreal font-black tracking-[-0.04em] leading-[0.9] text-5xl sm:text-6xl md:text-7xl break-words">
          {titulo}
        </h1>

        {intro?.trim() && (
          <div className="mt-6 max-w-2xl space-y-4">
            {intro.trim().split(/\n\n+/).map((p, i) => (
              <p key={i} className="text-sm md:text-base leading-relaxed text-manso-cream/70 whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Bandas horizontales a sangre */}
      {banners.length > 0 && (
        <div className="mt-16 md:mt-24">
          {banners.map((banner, i) => (
            <section
              key={banner.id}
              className={`relative w-full overflow-hidden flex items-center justify-center min-h-[240px] ${ALTURA_BANNER[i % ALTURA_BANNER.length]}`}
            >
              <img
                src={banner.imagen_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover grayscale"
              />
              <div className="absolute inset-0 bg-manso-black/55" />

              <div className="relative z-10 text-center px-6 max-w-3xl">
                {banner.titulo && (
                  <h2 className="font-montreal font-black uppercase tracking-[0.02em] leading-tight text-2xl sm:text-3xl md:text-4xl">
                    {banner.titulo}
                  </h2>
                )}
                {banner.subtitulo && (
                  <p className="mt-3 text-[11px] sm:text-xs font-bold uppercase tracking-[0.15em] leading-relaxed text-manso-cream/80 whitespace-pre-line">
                    {banner.subtitulo}
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Bloques de texto con las fotos desparramadas */}
      {bloques.length > 0 && (
        <div id="bloques" className="max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-28 space-y-12 md:space-y-16">
          {bloques.map((bloque, i) => {
            const disperso = DISPERSION[i % DISPERSION.length];
            return (
              <div
                key={bloque.id}
                className="grid grid-cols-1 md:grid-cols-[1.1fr_1.8fr_1.1fr] gap-6 md:gap-8 items-center"
              >
                {/* En desktop cada foto va a su costado; en mobile no hay
                    costados, así que van las dos abajo, una al lado de la otra. */}
                <div className="hidden md:block">
                  {bloque.foto_izquierda_url && (
                    <Foto src={bloque.foto_izquierda_url} className={disperso.izq} />
                  )}
                </div>

                <p className="text-center text-base sm:text-lg md:text-xl leading-relaxed whitespace-pre-line text-manso-cream">
                  {bloque.texto}
                </p>

                <div className="hidden md:block">
                  {bloque.foto_derecha_url && (
                    <Foto src={bloque.foto_derecha_url} className={disperso.der} />
                  )}
                </div>

                {(bloque.foto_izquierda_url || bloque.foto_derecha_url) && (
                  <div className="md:hidden grid grid-cols-2 gap-3">
                    {bloque.foto_izquierda_url && (
                      <Foto src={bloque.foto_izquierda_url} className="w-full" />
                    )}
                    {bloque.foto_derecha_url && (
                      <Foto src={bloque.foto_derecha_url} className="w-full" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="pb-24" />
    </main>
  );
};
