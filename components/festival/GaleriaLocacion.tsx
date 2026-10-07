interface Props {
  fotos: string[];
  alt: string;
}

/**
 * Mosaico de /festival/locacion, copiado de la página "Location" de Basilar:
 * filas que alternan cuatro fotos altas de anchos distintos y tres apaisadas
 * bajas, todas recortadas con `object-cover` para que la grilla no dependa de
 * la proporción con que se suban. Son miniaturas para ver varias de un
 * vistazo: una fila incompleta conserva las columnas del patrón y deja el
 * hueco, así una foto sola no se estira a todo el ancho.
 *
 * En el celular es una grilla de tres columnas en 4:3.
 *
 * Sin filtro de color: las fotos se ven como se subieron (pedido del equipo).
 */

const FILAS = [
  { cantidad: 4, columnas: '1.8fr 1.8fr 0.75fr 1fr', alto: 'md:h-[clamp(130px,12vw,190px)]' },
  { cantidad: 3, columnas: '1fr 1fr 1fr', alto: 'md:h-[clamp(70px,6vw,100px)]' },
];

function armarFilas(fotos: string[]) {
  const filas: { fotos: string[]; inicio: number; columnas: string; alto: string }[] = [];
  for (let i = 0, f = 0; i < fotos.length; f++) {
    const patron = FILAS[f % FILAS.length];
    const tramo = fotos.slice(i, i + patron.cantidad);
    filas.push({
      fotos: tramo,
      inicio: i,
      columnas: patron.columnas,
      alto: patron.alto,
    });
    i += tramo.length;
  }
  return filas;
}

export function GaleriaLocacion({ fotos, alt }: Props) {
  if (fotos.length === 0) return null;
  const filas = armarFilas(fotos);

  return (
    <div className="grid grid-cols-3 gap-2 md:block md:space-y-4">
      {filas.map((fila, f) => (
        <div
          key={f}
          className={`contents md:grid md:gap-4 md:[grid-template-columns:var(--cols)] ${fila.alto}`}
          style={{ '--cols': fila.columnas } as React.CSSProperties}
        >
          {fila.fotos.map((src, j) => {
            // Índice global: la misma foto subida dos veces no choca en la key.
            const i = fila.inicio + j;
            return (
              <img
                key={i}
                src={src}
                alt={alt}
                loading="lazy"
                decoding="async"
                className="block w-full aspect-[4/3] md:aspect-auto md:h-full object-cover"
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
