import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BloqueMailing, SliceRow, SliceCell, Hotspot } from "@/emails/campania-generica";

// Ancho base del mail (px). Las celdas se dimensionan contra este ancho.
const ANCHO_MAIL = 600;
// Cortes más finos que esto (en %) se fusionan para evitar rebanadas de 1px.
const EPSILON = 0.5;

export type { Hotspot };

const clamp = (v: number) => Math.min(100, Math.max(0, v));

/** Devuelve los cortes únicos ordenados (en %), fusionando los casi iguales. */
function cortes(valores: number[]): number[] {
  const ordenados = [...new Set([0, 100, ...valores.map(clamp)])].sort((a, b) => a - b);
  const resultado: number[] = [ordenados[0]];
  for (const v of ordenados.slice(1)) {
    if (v - resultado[resultado.length - 1] >= EPSILON) resultado.push(v);
  }
  // Garantizar que 100 siempre cierra el rango
  if (resultado[resultado.length - 1] !== 100) resultado[resultado.length - 1] = 100;
  return resultado;
}

/** Hotspot que cubre por completo la banda [y0, y1). */
function hotspotEnBanda(hotspots: Hotspot[], y0: number, y1: number): Hotspot[] {
  return hotspots.filter((hs) => clamp(hs.y) <= y0 + EPSILON && clamp(hs.y + hs.h) >= y1 - EPSILON);
}

/**
 * Corta una imagen en franjas/celdas según sus hotspots y sube cada pedazo a
 * Supabase Storage. Devuelve las filas listas para renderizar como tabla en
 * el template del mail (la técnica clásica de email: la imagen se ve entera,
 * pero la zona del botón es un <a> con su propia rebanada adentro).
 */
export async function cortarImagenConHotspots(
  supabase: SupabaseClient,
  campaniaId: string,
  bloqueIdx: number,
  url: string,
  hotspots: Hotspot[]
): Promise<SliceRow[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar la imagen del canvas (${res.status})`);
  const original = Buffer.from(await res.arrayBuffer());

  const meta = await sharp(original).metadata();
  const W = meta.width ?? 0;
  const H = meta.height ?? 0;
  if (!W || !H) throw new Error("No se pudieron leer las dimensiones de la imagen");

  // PNG conserva transparencia; el resto va a JPEG.
  const esPng = meta.format === "png";
  const ext = esPng ? "png" : "jpg";
  const contentType = esPng ? "image/png" : "image/jpeg";

  const filasY = cortes(hotspots.flatMap((hs) => [hs.y, hs.y + hs.h]));
  const rows: SliceRow[] = [];

  for (let r = 0; r < filasY.length - 1; r++) {
    const y0 = filasY[r];
    const y1 = filasY[r + 1];
    const enBanda = hotspotEnBanda(hotspots, y0, y1);

    const columnasX = enBanda.length
      ? cortes(enBanda.flatMap((hs) => [hs.x, hs.x + hs.w]))
      : [0, 100];

    const cells: SliceCell[] = [];

    for (let c = 0; c < columnasX.length - 1; c++) {
      const x0 = columnasX[c];
      const x1 = columnasX[c + 1];

      // Bordes redondeados sobre la imagen original (los anchos suman exacto)
      const left = Math.round((x0 / 100) * W);
      const right = Math.round((x1 / 100) * W);
      const top = Math.round((y0 / 100) * H);
      const bottom = Math.round((y1 / 100) * H);
      if (right - left < 1 || bottom - top < 1) continue;

      let pipeline = sharp(original).extract({
        left,
        top,
        width: right - left,
        height: bottom - top,
      });
      pipeline = esPng ? pipeline.png() : pipeline.jpeg({ quality: 88 });
      const slice = await pipeline.toBuffer();

      const path = `slices/${campaniaId}/${bloqueIdx}-${r}-${c}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("emails")
        .upload(path, slice, { contentType, upsert: true });
      if (uploadError) throw new Error(`Error subiendo rebanada: ${uploadError.message}`);

      const { data } = supabase.storage.from("emails").getPublicUrl(path);

      // Ancho de la celda contra el mail de 600px (bordes redondeados → suman 600)
      const cellLeft = Math.round((x0 / 100) * ANCHO_MAIL);
      const cellRight = Math.round((x1 / 100) * ANCHO_MAIL);

      const dueno = enBanda.find(
        (hs) => clamp(hs.x) <= x0 + EPSILON && clamp(hs.x + hs.w) >= x1 - EPSILON
      );

      cells.push({
        url: data.publicUrl,
        width: cellRight - cellLeft,
        link: dueno?.link ?? null,
      });
    }

    if (cells.length) rows.push({ cells });
  }

  return rows;
}

/**
 * Convierte los bloques 'canvas' de una campaña en bloques 'canvas-procesado'
 * (con las rebanadas ya subidas al storage). Los demás bloques pasan intactos,
 * lo que mantiene compatible el historial de campañas viejas.
 */
export async function procesarBloquesCanvas(
  supabase: SupabaseClient,
  campaniaId: string,
  bloques: BloqueMailing[]
): Promise<BloqueMailing[]> {
  const resultado: BloqueMailing[] = [];

  for (let i = 0; i < bloques.length; i++) {
    const bloque = bloques[i];
    if (bloque.tipo !== "canvas") {
      resultado.push(bloque);
      continue;
    }

    // Sin zonas marcadas: la imagen viaja entera, sin cortar.
    if (!bloque.hotspots?.length) {
      resultado.push({ tipo: "imagen", url: bloque.url, alt: bloque.alt });
      continue;
    }

    const rows = await cortarImagenConHotspots(supabase, campaniaId, i, bloque.url, bloque.hotspots);
    resultado.push({ tipo: "canvas-procesado", rows, alt: bloque.alt });
  }

  return resultado;
}
