interface Props {
  src: string;
  alt: string;
  /** Línea chica en mono sobre la foto, abajo a la izquierda. */
  pie?: string;
}

/**
 * Foto a sangre con tratamiento de película: tono cálido y algo lavado, grano,
 * viñeta y una fuga de luz en un borde — como las fotos analógicas de las
 * láminas de Ana. Todo es CSS encima de una foto común, así que cuando haya
 * material propio (escaneado de negativo o no) alcanza con cambiar `src`.
 */
export function FotoAnalogica({ src, alt, pie }: Props) {
  return (
    <figure className="relative -mx-5 sm:-mx-10 h-[70svh] min-h-[420px] max-h-[900px] overflow-hidden">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover [filter:sepia(0.18)_saturate(0.85)_contrast(0.92)_brightness(0.95)]"
      />

      {/* Fuga de luz: naranja quemado entrando por el borde, como un rollo velado. */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-1/2 mix-blend-screen opacity-45 bg-[radial-gradient(ellipse_at_right,rgb(255_110_40/0.9),transparent_65%)]"
      />
      {/* Viñeta y fundido con la página arriba y abajo. */}
      <div aria-hidden className="absolute inset-0 shadow-[inset_0_0_160px_40px_rgb(0_0_0/0.55)]" />
      <div aria-hidden className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[var(--fest-fondo)] to-transparent" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--fest-fondo)] to-transparent" />
      <div aria-hidden className="fest-grano !opacity-35" />

      {pie && (
        <figcaption className="absolute left-5 sm:left-10 bottom-8 text-[10px] sm:text-xs uppercase tracking-[0.3em] opacity-80">
          {pie}
        </figcaption>
      )}
    </figure>
  );
}
