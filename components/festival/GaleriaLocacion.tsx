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
 */
export function GaleriaLocacion({ fotos, alt }: Props) {
  if (fotos.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 sm:gap-4">
      {fotos.map((src, i) => (
        <img
          // Índice: la misma foto subida dos veces no choca en la key.
          key={i}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="block h-[clamp(200px,32vw,460px)] w-auto max-w-full"
        />
      ))}
    </div>
  );
}
