/**
 * Título de sección como cinturón: la palabra repetida corriendo de derecha a
 * izquierda, a lo ancho de toda la pantalla.
 *
 * El loop es infinito porque la cinta lleva el contenido dos veces y la
 * animación la corre exactamente hasta la mitad (`marquee`, en globals.css):
 * cuando termina, la segunda copia está donde arrancó la primera y el salto no
 * se ve. Por eso las dos copias tienen que ser idénticas.
 *
 * Para el lector de pantalla el título se dice una sola vez: la cinta va con
 * `aria-hidden` y el texto real viaja en un `sr-only`.
 */
interface Props {
  texto: string;
  /** Etiqueta del encabezado. La página tiene un solo h1; el resto, h2. */
  as?: 'h1' | 'h2';
  /** Cuánto tarda en dar la vuelta. Más grande, más lento. */
  segundos?: number;
  /** Veces que entra la palabra en cada copia. Cada copia debe pasar el ancho
   *  de la pantalla, si no la cinta se corta antes de reiniciar. */
  repeticiones?: number;
  className?: string;
}

export function TituloCinta({
  texto,
  as: Tag = 'h1',
  segundos = 28,
  repeticiones = 4,
  className = '',
}: Props) {
  const copia = Array.from({ length: repeticiones }, (_, i) => (
    // Sin separador entre palabras, solo aire: la Helvetica Neue Pro no trae
    // glifo para `·` (sale un cuadrado) y el `_` de Manso, a este cuerpo, se
    // lee como una raya suelta.
    <span key={i} className="pr-[0.45em]">
      {texto}
    </span>
  ));

  return (
    <Tag className={`relative overflow-hidden select-none ${className}`}>
      <span className="sr-only">{texto}</span>

      <span
        aria-hidden="true"
        className="flex w-max animate-marquee motion-reduce:animate-none text-manso-terra font-black uppercase italic tracking-tighter leading-[0.85] text-[clamp(3rem,11.9vw,9.35rem)]"
        style={{ animationDuration: `${segundos}s` }}
      >
        <span className="flex shrink-0">{copia}</span>
        <span className="flex shrink-0">{copia}</span>
      </span>
    </Tag>
  );
}
