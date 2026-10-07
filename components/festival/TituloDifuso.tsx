/**
 * El nombre del festival con el tratamiento del logo de Basilar: letra muy
 * ancha y pesada, con todas las esquinas redondeadas (también las de adentro)
 * y el borde apenas difuso.
 *
 * El redondeo es un filtro SVG: se difumina el texto y se le vuelve a cortar
 * el alfa con un umbral, así las esquinas quedan "derretidas"; después, un
 * desenfoque leve encima. Las medidas van en `objectBoundingBox` —fracción de
 * la caja del título— para que el efecto escale con el tamaño de letra. Están
 * calibradas para una palabra corta como "Blur": en horizontal la caja crece
 * con la cantidad de letras, así que con un texto largo redondea más.
 */
export function TituloDifuso({ texto }: { texto: string }) {
  return (
    <>
      <svg aria-hidden width="0" height="0" className="absolute">
        <filter
          id="fest-titulo-difuso"
          primitiveUnits="objectBoundingBox"
          x="-5%"
          y="-20%"
          width="110%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.0042 0.028" result="difuso" />
          <feComponentTransfer in="difuso" result="redondo">
            <feFuncA type="linear" slope="12" intercept="-5" />
          </feComponentTransfer>
          <feGaussianBlur in="redondo" stdDeviation="0.0017 0.011" />
        </filter>
      </svg>
      <h1 className="fest-titulo inline-block leading-[0.95] text-[clamp(2.4rem,13.2vw,9.5rem)] sm:text-[clamp(2.4rem,7.2vw,7rem)] [filter:url(#fest-titulo-difuso)]">
        {texto}
      </h1>
    </>
  );
}
