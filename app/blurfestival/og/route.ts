import sharp from 'sharp';
import { createSupabaseAnon } from '@/lib/supabase';
import { IMAGEN_POR_DEFECTO } from '@/lib/festival-seo';

/**
 * Imagen al compartir /blurfestival (WhatsApp, Instagram, X): el flyer que Ana sube en
 * Festival → Datos, entero y sobre el fondo del festival.
 *
 * WhatsApp recorta al centro cualquier og:image que no sea apaisada, así que un
 * flyer vertical pasado crudo sale cortado por la mitad. Acá se acomoda entero
 * en 1200×630; uno apaisado va a sangre. Sale en JPEG porque las vistas previas
 * pesadas (~300 KB) las descarta WhatsApp.
 *
 * Cliente anónimo a propósito: el crawler no tiene sesión y el RLS devuelve la
 * fila solo si el festival está publicado, igual que las páginas.
 */
const ANCHO = 1200;
const ALTO = 630;
const FONDO_POR_DEFECTO = '#003009';

export async function GET(req: Request) {
  const { data: config } = await createSupabaseAnon()
    .from('festival_config')
    .select('flyer_url, banner_url, color_fondo')
    .eq('id', 1)
    .maybeSingle();

  const respaldo = () => Response.redirect(new URL(config?.banner_url || IMAGEN_POR_DEFECTO, req.url), 307);
  if (!config?.flyer_url) return respaldo();

  try {
    const res = await fetch(config.flyer_url);
    if (!res.ok) return respaldo();

    const original = sharp(Buffer.from(await res.arrayBuffer())).rotate();
    const { width = 0, height = 0 } = await original.metadata();
    if (!width || !height) return respaldo();

    let salida: ReturnType<typeof sharp>;
    if (width / height >= 0.95) {
      salida = original.resize(ANCHO, ALTO, { fit: 'cover' });
    } else {
      const flyer = await original.resize({ width: ANCHO, height: ALTO, fit: 'inside' }).toBuffer();
      salida = sharp({
        create: { width: ANCHO, height: ALTO, channels: 3, background: config.color_fondo || FONDO_POR_DEFECTO },
      }).composite([{ input: flyer, gravity: 'center' }]);
    }

    const jpeg = await salida.jpeg({ quality: 78, mozjpeg: true }).toBuffer();
    return new Response(new Uint8Array(jpeg), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400',
      },
    });
  } catch {
    return respaldo();
  }
}
