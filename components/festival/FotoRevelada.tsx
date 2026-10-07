interface Props {
  src: string;
  alt: string;
  /** Línea chica en mono en el borde de abajo del marco. */
  pie?: string | null;
  /** Proporción de la foto: 4/5 por defecto, cuadrada en el artista. */
  cuadrada?: boolean;
  prioridad?: boolean;
}

/**
 * Foto con marco de copia revelada: borde de papel más grueso abajo, con el pie
 * escrito ahí, y el tono cálido y algo lavado de siempre. Todo es CSS encima
 * de una foto común.
 */
export function FotoRevelada({ src, alt, pie, cuadrada, prioridad }: Props) {
  return (
    <figure className="relative bg-[var(--fest-texto)]/[0.06] p-2.5 pb-[34px]">
      <img
        src={src}
        alt={alt}
        loading={prioridad ? 'eager' : 'lazy'}
        fetchPriority={prioridad ? 'high' : undefined}
        decoding="async"
        className={`block w-full object-cover [filter:sepia(0.3)_saturate(0.8)_contrast(0.9)] ${
          cuadrada ? 'aspect-square' : 'aspect-[4/5]'
        }`}
      />
      {pie && (
        <figcaption className="fest-mono absolute left-3 bottom-2.5 text-[10px] tracking-[0.25em] uppercase opacity-55">
          {pie}
        </figcaption>
      )}
    </figure>
  );
}
