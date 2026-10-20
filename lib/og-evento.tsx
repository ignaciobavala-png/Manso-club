import { ImageResponse } from 'next/og';
import sharp from 'sharp';

export const OG_SIZE = { width: 1200, height: 630 };

const MANSO_BLACK = '#000000';
const MANSO_CREAM = '#FFFCDC';
const MANSO_TERRA = '#BC2915';

/** Fecha en hora de Buenos Aires: el servidor corre en UTC y correría el día. */
export function fechaParaOg(iso: string): string {
  const d = new Date(iso);
  const dia = d.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
  const hora = d.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires',
  });
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} · ${hora} hs`;
}

interface Imagen {
  src: string;
  ancho: number;
  alto: number;
  /** Apaisada: va de fondo a sangre. Vertical: va entera al costado. */
  apaisada: boolean;
}

/**
 * Baja la imagen y la deja como PNG. Satori no lee todos los formatos (los
 * flyers vienen en webp) y, sobre todo, WhatsApp recorta al centro cualquier
 * og:image que no sea apaisada: un flyer vertical sale cortado por la mitad.
 * Por eso lo vertical se acomoda entero acá y no se pasa crudo. Lo apaisado
 * (fotos del espacio) sí puede recortarse sin perder nada.
 */
async function prepararImagen(url: string): Promise<Imagen | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const original = sharp(Buffer.from(await res.arrayBuffer()));
    const { width = 0, height = 0 } = await original.metadata();
    if (!width || !height) return null;

    const apaisada = width / height >= 0.95;
    const { data, info } = apaisada
      ? await original.resize(OG_SIZE.width, OG_SIZE.height, { fit: 'cover' }).png().toBuffer({ resolveWithObject: true })
      : await original
          .resize({ height: OG_SIZE.height, width: 520, fit: 'inside' })
          .png()
          .toBuffer({ resolveWithObject: true });

    return {
      src: `data:image/png;base64,${data.toString('base64')}`,
      ancho: info.width,
      alto: info.height,
      apaisada,
    };
  } catch {
    return null;
  }
}

interface Datos {
  titulo: string;
  categoria?: string | null;
  /** Línea chica bajo el título: la fecha, o el día de cursada. */
  linea?: string | null;
  imagenUrl?: string | null;
}

/** Tarjeta 1200×630: el flyer entero a la izquierda y los datos a la derecha. */
export async function tarjetaOgEvento({ titulo, categoria, linea, imagenUrl }: Datos): Promise<Response> {
  const imagen = imagenUrl ? await prepararImagen(imagenUrl) : null;
  const flyer = imagen && !imagen.apaisada ? imagen : null;
  const fondo = imagen?.apaisada ? imagen : null;

  const png = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: `linear-gradient(135deg, ${MANSO_BLACK} 55%, #3a0d06 100%)`,
          color: MANSO_CREAM,
        }}
      >
        {fondo && (
          <>
            <img src={fondo.src} width={OG_SIZE.width} height={OG_SIZE.height} alt="" style={{ position: 'absolute', top: 0, left: 0 }} />
            <div
              style={{
                display: 'flex',
                position: 'absolute',
                top: 0,
                left: 0,
                width: OG_SIZE.width,
                height: OG_SIZE.height,
                backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.1), rgba(0,0,0,0.8) 50%, rgba(0,0,0,0.95))',
              }}
            />
          </>
        )}
        {flyer && <img src={flyer.src} width={flyer.ancho} height={flyer.alto} alt="" />}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: 1,
            padding: '56px 64px',
            ...(fondo && { marginLeft: 540 }),
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                fontSize: 22,
                letterSpacing: 8,
                textTransform: 'uppercase',
                color: MANSO_TERRA,
                fontWeight: 700,
              }}
            >
              {categoria || 'Manso Club'}
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 28,
                fontSize: titulo.length > 28 ? 60 : 78,
                lineHeight: 1,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: -2,
              }}
            >
              {titulo}
            </div>
            {linea && (
              <div style={{ display: 'flex', marginTop: 32, fontSize: 32, color: 'rgba(255,252,220,0.7)' }}>
                {linea}
              </div>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 24,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: 'rgba(255,252,220,0.5)',
            }}
          >
            mansoclub.com.ar
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );

  // WhatsApp descarta las vistas previas pesadas (alrededor de 300 KB): el PNG
  // con un flyer adentro pasa de 800 KB, el mismo cuadro en JPEG ronda los 80.
  const jpeg = await sharp(Buffer.from(await png.arrayBuffer()))
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();

  return new Response(new Uint8Array(jpeg), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400',
    },
  });
}
