import { unstable_cache } from 'next/cache';

/**
 * Ancho y alto de una imagen remota leyendo solo su cabecera.
 *
 * Sirve para armar mosaicos sin recortar las fotos: hay que saber la
 * proporción de cada una antes de que llegue al navegador. Se pide un rango
 * de 64 KB y no el archivo entero porque cada byte que sale de Supabase cuenta
 * contra el egress del plan free; y como las rutas de Storage son únicas (nombre
 * al azar en cada subida), el resultado se cachea sin vencimiento.
 *
 * Entiende WebP, JPEG y PNG. En JPEG respeta la orientación EXIF (las fotos de
 * celular sin pasar por el compresor vienen "acostadas" con la marca de girar).
 */
export const medidaImagen = unstable_cache(
  async (url: string): Promise<[number, number] | null> => {
    try {
      const res = await fetch(url, { headers: { Range: 'bytes=0-65535' } });
      if (!res.ok) return null;
      return leerMedida(new Uint8Array(await res.arrayBuffer()));
    } catch {
      return null;
    }
  },
  ['medida-imagen'],
  { revalidate: false }
);

function leerMedida(b: Uint8Array): [number, number] | null {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const ascii = (i: number, n: number) => String.fromCharCode(...b.subarray(i, i + n));

  if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') {
    const trozo = ascii(12, 4);
    if (trozo === 'VP8X') return [1 + (v.getUint32(24, true) & 0xffffff), 1 + (v.getUint32(27, true) & 0xffffff)];
    if (trozo === 'VP8 ') return [v.getUint16(26, true) & 0x3fff, v.getUint16(28, true) & 0x3fff];
    if (trozo === 'VP8L') {
      const bits = v.getUint32(21, true);
      return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
    }
    return null;
  }

  if (ascii(1, 3) === 'PNG') return [v.getUint32(16), v.getUint32(20)];

  if (b[0] === 0xff && b[1] === 0xd8) {
    let girada = false;
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null;
      const marca = b[i + 1];
      const largo = v.getUint16(i + 2);
      if (marca === 0xe1 && ascii(i + 4, 4) === 'Exif') girada = orientacionGirada(v, i + 10);
      // SOF0..SOF15 salvo DHT (C4), JPG (C8) y DAC (CC): ahí está la medida.
      if (marca >= 0xc0 && marca <= 0xcf && marca !== 0xc4 && marca !== 0xc8 && marca !== 0xcc) {
        const h = v.getUint16(i + 5);
        const w = v.getUint16(i + 7);
        return girada ? [h, w] : [w, h];
      }
      i += 2 + largo;
    }
  }
  return null;
}

/** Orientaciones EXIF 5 a 8 traen el ancho y el alto cambiados. */
function orientacionGirada(v: DataView, tiff: number): boolean {
  try {
    const le = v.getUint16(tiff) === 0x4949;
    const ifd = tiff + v.getUint32(tiff + 4, le);
    const entradas = v.getUint16(ifd, le);
    for (let k = 0; k < entradas; k++) {
      const e = ifd + 2 + k * 12;
      if (v.getUint16(e, le) === 0x0112) return v.getUint16(e + 8, le) >= 5;
    }
  } catch {
    // EXIF cortado por el rango: se toma sin girar.
  }
  return false;
}
