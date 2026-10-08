import Image from 'next/image';
import { medidaImagen } from '@/lib/medida-imagen';
import { VisorFotos } from './VisorFotos';

interface Props {
  fotos: string[];
  alt: string;
}

/**
 * Mosaico de /blur/locacion: cada renglón llena el ancho justo y las fotos
 * se ven enteras, sin recorte y sin huecos.
 *
 * Antes eran todas a la misma altura en un `flex-wrap`, y en el celular una
 * foto apaisada no entraba a 200px de alto, se aplastaba contra el borde, y
 * cada renglón terminaba con un blanco distinto. Ahora el servidor lee la
 * proporción de cada foto (`medidaImagen`, solo la cabecera) y elige dónde
 * cortar los renglones para que todos queden cerca de un alto ideal: dentro
 * del renglón cada foto crece según su proporción, así que suman el ancho
 * exacto. Respeta el orden del panel; lo que se elige es el corte.
 *
 * El corte depende del ancho de pantalla, así que se arman tres mosaicos y
 * el CSS muestra uno. Los ocultos no bajan nada: `next/image` va con
 * `loading="lazy"` y el navegador no carga imágenes con `display: none`.
 *
 * Sin filtro de color: las fotos se ven como se subieron (pedido del equipo).
 * Cada una se abre entera en `VisorFotos` al tocarla. Lo usan Locación y Spots.
 */

/** Ancho útil supuesto, alto ideal del renglón y separación, por pantalla. */
const PANTALLAS = [
  { clase: 'flex sm:hidden', ancho: 343, alto: 230, gap: 8 },
  { clase: 'hidden sm:flex lg:hidden', ancho: 700, alto: 300, gap: 16 },
  { clase: 'hidden lg:flex', ancho: 1300, alto: 400, gap: 16 },
] as const;

/** Proporción para una foto que no se pudo medir: la vertical de celular. */
const PROPORCION_POR_DEFECTO = 3 / 4;

export async function GaleriaLocacion({ fotos, alt }: Props) {
  if (fotos.length === 0) return null;

  const proporciones = await Promise.all(
    fotos.map(async src => {
      const medida = await medidaImagen(src);
      return medida ? medida[0] / medida[1] : PROPORCION_POR_DEFECTO;
    })
  );

  return (
    <VisorFotos fotos={fotos} alt={alt}>
      {PANTALLAS.map(p => (
        <div key={p.clase} className={`${p.clase} flex-col`} style={{ gap: p.gap }}>
          {cortarRenglones(proporciones, p.ancho, p.alto, p.gap).map(([desde, hasta]) => {
            const suma = proporciones.slice(desde, hasta).reduce((a, r) => a + r, 0);
            return (
              <div key={desde} className="flex" style={{ gap: p.gap }}>
                {fotos.slice(desde, hasta).map((src, k) => {
                  const r = proporciones[desde + k];
                  // Qué parte del ancho de pantalla ocupa esta foto, para el srcset.
                  const vw = Math.ceil((r / suma) * 100);
                  return (
                    <button
                      type="button"
                      key={desde + k}
                      data-foto={desde + k}
                      aria-label={`Ver foto ${desde + k + 1} de ${fotos.length}`}
                      className="relative min-w-0 cursor-zoom-in"
                      style={{ flex: `${r} 1 0`, aspectRatio: r }}
                    >
                      <Image src={src} alt={alt} fill sizes={`${vw}vw`} className="object-cover" />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}
    </VisorFotos>
  );
}

/**
 * Divide las fotos en renglones consecutivos minimizando cuánto se aleja cada
 * renglón del alto ideal (el mismo criterio que usan Flickr o Google Fotos).
 * Programación dinámica: `mejor[j]` es el costo mínimo de acomodar las
 * primeras `j` fotos. Devuelve pares `[desde, hasta)`.
 */
function cortarRenglones(proporciones: number[], ancho: number, ideal: number, gap: number): [number, number][] {
  const n = proporciones.length;
  const mejor = new Array<number>(n + 1).fill(Infinity);
  const corte = new Array<number>(n + 1).fill(0);
  mejor[0] = 0;

  for (let j = 1; j <= n; j++) {
    let suma = 0;
    for (let i = j - 1; i >= 0; i--) {
      suma += proporciones[i];
      const alto = (ancho - gap * (j - i - 1)) / suma;
      // Un renglón tan lleno que las fotos quedan como estampillas no sirve.
      if (alto < ideal * 0.4 && j - i > 1) break;
      const costo = mejor[i] + ((alto - ideal) / ideal) ** 2;
      if (costo < mejor[j]) {
        mejor[j] = costo;
        corte[j] = i;
      }
    }
  }

  const renglones: [number, number][] = [];
  for (let j = n; j > 0; j = corte[j]) renglones.unshift([corte[j], j]);
  return renglones;
}
