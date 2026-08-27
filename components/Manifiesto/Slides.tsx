import { ImageOff, Type } from 'lucide-react';

/**
 * Las dos slides que abren el manifiesto. Son bandas a todo el ancho, así que
 * viven fuera del contenedor de lectura.
 *
 * Mientras no haya imagen cargada muestran un placeholder en vez de
 * desaparecer: la idea es que Ana vea el hueco y sepa que ahí va algo, en el
 * sitio y no solo en el panel.
 */

const ALTO = 'h-[45vh] min-h-[280px] sm:h-[55vh]';

/** Slide 1: una frase encima de una imagen de fondo. */
export function SlideFrase({ imagen, frase }: { imagen: string | null; frase: string | null }) {
  return (
    <section className={`relative w-full ${ALTO} overflow-hidden bg-manso-carbon`}>
      {imagen ? (
        <>
          <img src={imagen} alt="" className="absolute inset-0 w-full h-full object-cover" />
          {/* La frase tiene que leerse sobre cualquier foto, clara u oscura */}
          <div className="absolute inset-0 bg-black/45" />
        </>
      ) : (
        <Placeholder icono={<Type size={22} />} texto="Imagen de fondo" />
      )}

      {frase && (
        <div className="relative h-full flex items-center justify-center px-8">
          <p className="max-w-3xl text-center text-manso-white font-black italic tracking-tight leading-[1.15] text-[clamp(1.35rem,3.4vw,2.6rem)] [text-shadow:0_2px_24px_rgba(0,0,0,0.55)]">
            {frase}
          </p>
        </div>
      )}
    </section>
  );
}

/** Slide 2: la imagen sola, sin texto encima. */
export function SlideImagen({ imagen }: { imagen: string | null }) {
  return (
    <section className={`relative w-full ${ALTO} overflow-hidden bg-manso-carbon`}>
      {imagen ? (
        <img src={imagen} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <Placeholder icono={<ImageOff size={22} />} texto="Imagen" />
      )}
    </section>
  );
}

function Placeholder({ icono, texto }: { icono: React.ReactNode; texto: string }) {
  return (
    <div className="absolute inset-3 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-manso-cream/20 text-manso-cream/30">
      {icono}
      <p className="text-[9px] font-black uppercase tracking-[0.4em]">{texto}</p>
      <p className="text-[10px] font-light tracking-wide text-manso-cream/20">
        Se carga desde el panel
      </p>
    </div>
  );
}
