import Image from 'next/image';

interface Props {
  fotos: string[];
  alt: string;
}

/**
 * Fotos de /festival/locacion: todas a la misma altura y cada una con el
 * ancho que le da su proporción, en renglones que se acomodan solos.
 *
 * Se ven enteras, sin recorte. Antes era un mosaico copiado de Basilar que
 * recortaba con `object-cover` a cajas apaisadas, y como las fotos que se
 * suben son verticales (del celular, 3:4) de cada una quedaba una franja.
 *
 * Sin filtro de color: las fotos se ven como se subieron (pedido del equipo).
 *
 * Pasan por `next/image` porque los originales son de 2400×3200 y hasta 3 MB
 * (el uploader solo limita el ancho) y acá se ven a 460px de alto como mucho:
 * con `<img>` la página bajaba ~17 MB. Como no sabemos la proporción de cada
 * foto, va `width/height = 0` y el alto lo fija el CSS; `sizes` alcanza para
 * que el navegador elija una versión chica del srcset.
 */
export function GaleriaLocacion({ fotos, alt }: Props) {
  if (fotos.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 sm:gap-4">
      {fotos.map((src, i) => (
        <Image
          // Índice: la misma foto subida dos veces no choca en la key.
          key={i}
          src={src}
          alt={alt}
          width={0}
          height={0}
          sizes="(min-width: 640px) 460px, 60vw"
          className="block h-[clamp(200px,32vw,460px)] w-auto max-w-full"
        />
      ))}
    </div>
  );
}
