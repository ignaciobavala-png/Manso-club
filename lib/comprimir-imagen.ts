/**
 * Compresión de imágenes en el navegador antes de subirlas a Supabase Storage.
 *
 * Estamos en el plan free de Supabase: lo que se agota es el egress (5 GB por
 * mes), y cada byte de más en una foto se paga en cada visita. Antes los
 * uploaders limitaban solo el ancho, así que una foto vertical de celular
 * quedaba de 2400×3200 y hasta 3 MB, y Locación del festival bajaba ~17 MB.
 *
 * Dos frenos:
 * - `maxLado` limita el lado más largo, no el ancho.
 * - `TOPE_BYTES`: si después de escalar el archivo pesa más, se baja la
 *   calidad y, si no alcanza, la medida, hasta que entre.
 */

/** Peso máximo de una foto subida desde el panel. */
export const TOPE_BYTES = 450_000;

const CALIDADES = [0.82, 0.74, 0.66];
/** Cuánto se achica la medida en cada vuelta si ninguna calidad alcanzó. */
const PASO_ESCALA = 0.8;
const VUELTAS_ESCALA = 3;

/** Medida final con el lado más largo en `maxLado` como mucho. */
export function medidaConTope(w: number, h: number, maxLado: number): [number, number] {
  const k = Math.min(1, maxLado / Math.max(w, h));
  return [Math.round(w * k), Math.round(h * k)];
}

function aBlob(canvas: HTMLCanvasElement, mime: string, calidad?: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, mime, calidad));
}

function achicar(canvas: HTMLCanvasElement, k: number): HTMLCanvasElement {
  const chico = document.createElement('canvas');
  chico.width = Math.max(1, Math.round(canvas.width * k));
  chico.height = Math.max(1, Math.round(canvas.height * k));
  chico.getContext('2d')!.drawImage(canvas, 0, 0, chico.width, chico.height);
  return chico;
}

/**
 * Codifica el canvas en WebP con calidad y medida bajando hasta entrar en
 * `tope`. Si ni así entra, devuelve el intento más chico: mejor una foto
 * pesada que una subida que falla.
 *
 * Safari no sabe codificar WebP desde un canvas y en silencio devuelve PNG,
 * que en una foto pesa varias veces más. Si el blob no salió en WebP se cae a
 * JPEG, que todos codifican.
 */
export async function codificarFoto(
  canvas: HTMLCanvasElement,
  tope = TOPE_BYTES
): Promise<{ blob: Blob; ext: 'webp' | 'jpg'; mime: string }> {
  let mime = 'image/webp';
  let ext: 'webp' | 'jpg' = 'webp';
  const prueba = await aBlob(canvas, mime, CALIDADES[0]);
  if (!prueba || prueba.type !== mime) {
    mime = 'image/jpeg';
    ext = 'jpg';
  }

  let actual = canvas;
  let ultimo: Blob | null = null;
  for (let vuelta = 0; vuelta <= VUELTAS_ESCALA; vuelta++) {
    for (const calidad of CALIDADES) {
      const blob = await aBlob(actual, mime, calidad);
      if (!blob) continue;
      ultimo = blob;
      if (blob.size <= tope) return { blob, ext, mime };
    }
    actual = achicar(actual, PASO_ESCALA);
  }

  if (!ultimo) throw new Error('No se pudo convertir la imagen');
  return { blob: ultimo, ext, mime };
}
