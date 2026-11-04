import Image from 'next/image';

/**
 * Una franja de color de la identidad de BLUR (PDF "BLUR - paleta") con sus
 * ilustraciones. Cada tema es un fondo de la paleta con el texto que lee bien
 * encima, y pisa las variables `--fest-*` solo dentro de la franja: el rótulo,
 * los links y el texto resaltado se adaptan solos. El tema "verde" es el del
 * panel (el de todo el sitio); los otros alternan por sección para que la
 * página no sea un solo color.
 */
const TEMAS = {
  verde: { fondo: '#003009', texto: '#FFFCDC', acento: '#F65200', resalte: '#FFA7FE' },
  gris: { fondo: '#EAEAEA', texto: '#1A1A1A', acento: '#F65200', resalte: '#005B15' },
  crema: { fondo: '#FFFCDC', texto: '#003009', acento: '#F65200', resalte: '#005B15' },
  rosa: { fondo: '#FFA7FE', texto: '#003009', acento: '#005B15', resalte: '#1A1A1A' },
  naranja: { fondo: '#F65200', texto: '#1A1A1A', acento: '#FFFCDC', resalte: '#003009' },
} as const;

export type TemaMarca = keyof typeof TEMAS;

/** Los recursos de la diseñadora (`public/blur/marca/`), con su tamaño real. */
export const RECURSOS = {
  figuras: { src: '/blur/marca/ilus-bailando.webp', w: 1100, h: 717, anim: 'fest-baila' },
  figurasBlancas: { src: '/blur/marca/ilus-bailando-b.webp', w: 1100, h: 717, anim: 'fest-baila' },
  nota: { src: '/blur/marca/ilus-nota-1.webp', w: 700, h: 556, anim: 'fest-flota' },
  notas: { src: '/blur/marca/ilus-notas-2.webp', w: 700, h: 538, anim: 'fest-flota' },
  texturaNaranja: { src: '/blur/marca/textura_1_color.svg', w: 900, h: 800, svg: true, anim: 'fest-brisa' },
  texturaBlanca: { src: '/blur/marca/textura_1_b.svg', w: 900, h: 800, svg: true, anim: 'fest-brisa' },
} as const;

type Recurso = (typeof RECURSOS)[keyof typeof RECURSOS];
export type DecoItem = { recurso: Recurso; className: string };

/** Decoración de cada franja, para que el home y las páginas completas se vean igual. */
export const DECO = {
  locacion: [
    { recurso: RECURSOS.texturaNaranja, className: 'right-[-4%] bottom-[-2%] w-[52%] sm:w-[26%]' },
    { recurso: RECURSOS.nota, className: 'right-[4%] top-[1.5%] w-[24%] sm:w-[9%]' },
  ],
  vision: [
    { recurso: RECURSOS.texturaBlanca, className: 'left-[-4%] bottom-0 w-[60%] sm:w-[26%] opacity-60' },
    { recurso: RECURSOS.figuras, className: 'right-[2%] bottom-[1.5%] w-[80%] sm:w-[30%]' },
    { recurso: RECURSOS.notas, className: 'left-[6%] bottom-[2%] w-[18%] sm:left-auto sm:right-[8%] sm:bottom-auto sm:top-[2%] sm:w-[8%]' },
  ],
  spots: [
    { recurso: RECURSOS.texturaNaranja, className: 'right-[-6%] top-[2%] w-[55%] sm:w-[24%]' },
    { recurso: RECURSOS.notas, className: 'right-[5%] bottom-[2%] w-[24%] sm:w-[9%]' },
  ],
  info: [
    { recurso: RECURSOS.figuras, className: 'right-[2%] bottom-[1.5%] w-[64%] sm:w-[26%]' },
    { recurso: RECURSOS.nota, className: 'left-[6%] bottom-[2%] w-[18%] sm:left-auto sm:right-[6%] sm:bottom-auto sm:top-[2%] sm:w-[8%]' },
  ],
  // Tickets: la tabla mide 980 px y deja márgenes anchos solo en pantallas grandes;
  // ahí van las figuras, y en las chicas solo la textura y una nota abajo.
  tickets: [
    { recurso: RECURSOS.texturaNaranja, className: 'left-[-6%] bottom-[-2%] w-[50%] sm:w-[22%]' },
    { recurso: RECURSOS.figuras, className: 'hidden 2xl:block right-[1.5%] top-[24%] w-[15%]' },
    { recurso: RECURSOS.nota, className: 'hidden 2xl:block left-[2.5%] top-[34%] w-[7%]' },
    { recurso: RECURSOS.notas, className: 'left-[44%] bottom-[2%] w-[16%] sm:w-[9%] 2xl:hidden' },
  ],
  lineup: [
    { recurso: RECURSOS.texturaBlanca, className: 'right-[-2%] top-0 w-[70%] sm:w-[36%] opacity-[0.18]' },
  ],
} satisfies Record<string, DecoItem[]>;

export function SeccionMarca({
  tema,
  deco = [],
  className = '',
  children,
}: {
  tema: TemaMarca;
  deco?: DecoItem[];
  className?: string;
  children: React.ReactNode;
}) {
  const t = TEMAS[tema];
  // El verde es el del panel: no se fija acá sino que se hereda de la raíz
  // (`data-fest-raiz`), porque el line-up cambia esas variables al pasar el
  // mouse y una franja que las fijara se quedaría quieta.
  const estilo =
    tema === 'verde'
      ? undefined
      : ({
          '--fest-fondo': t.fondo,
          '--fest-texto': t.texto,
          '--fest-acento': t.acento,
          '--fest-resalte': t.resalte,
        } as React.CSSProperties);

  return (
    <section
      style={estilo}
      className={`relative z-10 overflow-hidden bg-[var(--fest-fondo)] text-[var(--fest-texto)] fest-fondo selection:bg-[var(--fest-acento)] selection:text-[var(--fest-fondo)] ${className}`}
    >
      {deco.map(({ recurso, className: c }, i) => (
        <Image
          key={i}
          aria-hidden
          src={recurso.src}
          alt=""
          width={recurso.w}
          height={recurso.h}
          unoptimized={'svg' in recurso}
          sizes="40vw"
          // Cada pieza arranca en un punto distinto de su ciclo para que no se muevan al unísono.
          style={{ animationDelay: `${-i * 1.7}s` }}
          className={`absolute z-0 pointer-events-none select-none h-auto ${recurso.anim} ${c}`}
        />
      ))}
      <div className="relative z-10">{children}</div>
    </section>
  );
}
