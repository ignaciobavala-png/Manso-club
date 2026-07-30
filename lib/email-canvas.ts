import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BloqueMailing, SliceRow, SliceCell, Hotspot } from "@/emails/campania-generica";

// Ancho base del mail (px). Las celdas se dimensionan contra este ancho.
const ANCHO_MAIL = 600;
// Cortes más finos que esto (en %) se fusionan para evitar rebanadas de 1px.
const EPSILON = 0.5;


/**
 * Ancho mínimo de una columna, en píxeles del mail. Por debajo de esto la
 * columna se fusiona con su vecina.
 *
 * Por qué existe: cada celda se renderiza con `width:100%; height:auto`, así que
 * el cliente de correo calcula su altura con SU propia escala. Una columna
 * angosta redondea mucho peor que una ancha y las alturas dejan de coincidir.
 *
 * Caso real (campaña 2026-07-29): una zona clickeable dibujada desde x=1.31% en
 * vez de 0 dejó una columna residual de 25px. Renderizada daba 8px (escala
 * 0.3200) contra 592px de la columna ancha (escala 0.3124): 162px de alto
 * contra 158px. La fila toma la altura de la más alta y debajo de la otra
 * quedaba un hueco de 4px por el que se veía el fondo crema del mail,
 * atravesando el arte negro de lado a lado.
 */
const MIN_COL_PX = 12;
const MIN_COL_PCT = (MIN_COL_PX / ANCHO_MAIL) * 100; // 2%

/**
 * Zonas dibujadas casi pegadas al borde se pegan al borde. Nadie marca a mano
 * un rectángulo exacto de 0% a 100%, y ese margen involuntario es justo lo que
 * genera la columna residual. Ampliar el área clickeable unos píxeles no tiene
 * ningún costo: el link ya cubría prácticamente todo el ancho.
 */
function pegarABordes(hotspots: Hotspot[]): Hotspot[] {
  return hotspots.map((hs) => {
    const x0 = clamp(hs.x);
    const x1 = clamp(hs.x + hs.w);
    const izq = x0 < MIN_COL_PCT ? 0 : x0;
    const der = x1 > 100 - MIN_COL_PCT ? 100 : x1;
    return { ...hs, x: izq, w: der - izq };
  });
}

export type { Hotspot };

const clamp = (v: number) => Math.min(100, Math.max(0, v));

/**
 * Reescribe una URL del bucket público "emails" para que apunte al dominio
 * propio (ver el rewrite /email-assets en next.config.ts).
 *
 * Motivo: los filtros de spam penalizan que un mail cargue imágenes desde un
 * dominio ajeno al remitente — Resend lo marca como "Host images on the sending
 * domain". Estas campañas son casi solo imágenes, así que servirlas desde
 * *.supabase.co era la señal negativa más fuerte que teníamos.
 *
 * Se aplica al ENVIAR y no al guardar: así las campañas ya creadas (que tienen
 * la URL de Supabase persistida en `bloques`) quedan arregladas sin migrar
 * datos. Cualquier URL que no sea de este bucket pasa intacta.
 */
export function urlDominioPropio(url: string): string {
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (!supabase || !site) return url;

  const prefijo = `${supabase}/storage/v1/object/public/emails/`;
  if (!url.startsWith(prefijo)) return url;

  return `${site.replace(/\/$/, "")}/email-assets/${url.slice(prefijo.length)}`;
}

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

/**
 * Cortes de columna, descartando los que dejarían una columna más angosta que
 * MIN_COL_PCT. Una columna finita escala con un factor muy distinto al de sus
 * vecinas y rompe la alineación de alturas de toda la fila (ver MIN_COL_PX).
 * Perder el corte solo agranda o achica unos píxeles el área clickeable.
 */
function cortesColumnas(valores: number[]): number[] {
  const base = cortes(valores);
  const out: number[] = [base[0]];
  for (let i = 1; i < base.length - 1; i++) {
    const anchoIzq = base[i] - out[out.length - 1];
    const anchoDer = 100 - base[i];
    if (anchoIzq >= MIN_COL_PCT && anchoDer >= MIN_COL_PCT) out.push(base[i]);
  }
  out.push(base[base.length - 1]);
  return out;
}

/**
 * "Ruido" de cada fila de píxeles: max - min sobre una versión angosta y en
 * grises de la imagen. Una fila de fondo liso da ~0; una fila que cruza un
 * botón blanco sobre negro da ~255.
 */
async function ruidoPorFila(original: Buffer, H: number): Promise<number[]> {
  const ANCHO_MUESTRA = 120;
  const { data } = await sharp(original)
    .removeAlpha()
    .greyscale()
    .resize(ANCHO_MUESTRA, H, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ruido = new Array<number>(H);
  for (let y = 0; y < H; y++) {
    let min = 255;
    let max = 0;
    const base = y * ANCHO_MUESTRA;
    for (let x = 0; x < ANCHO_MUESTRA; x++) {
      const v = data[base + x];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    ruido[y] = max - min;
  }
  return ruido;
}

// Una fila con menos de este contraste se considera "lisa": cortar ahí no parte
// ningún elemento gráfico.
const UMBRAL_FILA_LISA = 10;

/**
 * Corre los bordes verticales de cada zona clickeable hasta la fila lisa más
 * cercana, para que el corte no pase por el medio de un botón.
 *
 * Por qué: arriba y abajo de un corte las columnas de la grilla son distintas
 * (una banda con hotspots se parte en columnas, la vecina no), así que el
 * contenido que cruza el corte cae en una grilla de subpíxel distinta y aparece
 * un escalón de 1px. Sobre la pastilla blanca de un botón se ve como un
 * mordisco en el borde redondeado.
 *
 * Corriendo el corte a una fila lisa (fondo plano), el escalón sigue existiendo
 * pero ocurre donde no hay nada que dibujar, así que es invisible. Además
 * agranda ligeramente el área clickeable, que no molesta.
 */
function pegarAFilasLisas(hotspots: Hotspot[], ruido: number[], H: number): Hotspot[] {
  const VENTANA = Math.round(H * 0.025);

  /** Fila lisa más cercana a `y`, o `y` si no hay ninguna en la ventana. */
  const filaLisa = (y: number, haciaAfuera: -1 | 1): number => {
    for (let d = 0; d <= VENTANA; d++) {
      // Preferir moverse hacia afuera del hotspot: agrandar el área nunca
      // recorta el botón, achicarla sí podría.
      for (const cand of [y + haciaAfuera * d, y - haciaAfuera * d]) {
        if (cand < 0 || cand >= H) continue;
        if (ruido[cand] <= UMBRAL_FILA_LISA) return cand;
      }
    }
    return y;
  };

  return hotspots.map((hs) => {
    const yTop = Math.round((clamp(hs.y) / 100) * H);
    const yBot = Math.round((clamp(hs.y + hs.h) / 100) * H);
    const top = filaLisa(yTop, -1);
    // +1 porque el recorte es [top, bot), o sea que la última fila incluida es
    // bot-1. Sin esto la banda terminaba justo ANTES de la fila lisa y se
    // llevaba el borde antialiasado del botón, dejando una línea clara colgando.
    const bot = filaLisa(yBot, 1) + 1;
    if (bot - top < 1 || bot > H) return hs;
    return { ...hs, y: (top / H) * 100, h: ((bot - top) / H) * 100 };
  });
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
  hotspotsCrudos: Hotspot[]
): Promise<SliceRow[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar la imagen del canvas (${res.status})`);
  const original = Buffer.from(await res.arrayBuffer());

  const meta = await sharp(original).metadata();
  const W = meta.width ?? 0;
  const H = meta.height ?? 0;
  if (!W || !H) throw new Error("No se pudieron leer las dimensiones de la imagen");

  // Ajustes de geometría, en este orden: primero pegar los bordes laterales
  // (elimina columnas residuales que desalinean las alturas de la fila) y
  // después correr los bordes verticales a filas lisas (evita que el corte
  // parta un botón al medio y deje un escalón en su contorno).
  const hotspots = pegarAFilasLisas(
    pegarABordes(hotspotsCrudos),
    await ruidoPorFila(original, H),
    H
  );

  // PNG conserva transparencia; el resto va a JPEG.
  const esPng = meta.format === "png";
  const ext = esPng ? "png" : "jpg";
  const contentType = esPng ? "image/png" : "image/jpeg";

  const filasY = cortes(hotspots.flatMap((hs) => [hs.y, hs.y + hs.h]));

  // Primera pasada: cortes de columnas de cada franja. Se calculan todos
  // antes de rebanar para armar la grilla maestra (unión de cortes): el
  // template renderiza UNA sola tabla y cada celda usa colspan contra esa
  // grilla — tablas separadas por franja generaban líneas finas al escalar
  // en el celular.
  const bandas = [] as { y0: number; y1: number; enBanda: Hotspot[]; columnasX: number[] }[];
  for (let r = 0; r < filasY.length - 1; r++) {
    const y0 = filasY[r];
    const y1 = filasY[r + 1];
    const enBanda = hotspotEnBanda(hotspots, y0, y1);
    const columnasX = enBanda.length
      ? cortesColumnas(enBanda.flatMap((hs) => [hs.x, hs.x + hs.w]))
      : [0, 100];
    bandas.push({ y0, y1, enBanda, columnasX });
  }

  const masterX = cortesColumnas(bandas.flatMap((b) => b.columnasX));
  const idxMaster = (v: number) => {
    let mejor = 0;
    let dist = Infinity;
    for (let i = 0; i < masterX.length; i++) {
      const d = Math.abs(masterX[i] - v);
      if (d < dist) {
        dist = d;
        mejor = i;
      }
    }
    return mejor;
  };

  const rows: SliceRow[] = [];

  for (const { y0, y1, enBanda, columnasX } of bandas) {
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
      // Sin submuestreo de croma y calidad alta: cada rebanada se comprime
      // por separado, y con menos calidad los bordes cambiaban de color
      // entre pedazos vecinos — se veía la línea de corte en el mail.
      pipeline = esPng ? pipeline.png() : pipeline.jpeg({ quality: 95, chromaSubsampling: "4:4:4" });
      const slice = await pipeline.toBuffer();

      const path = `slices/${campaniaId}/${bloqueIdx}-${rows.length}-${c}.${ext}`;
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

      // Color del BORDE INFERIOR de la rebanada, para pintar el <td>. Es la
      // segunda línea de defensa: si el cliente de correo redondea las alturas
      // y queda un hueco de 1px debajo de la imagen, ahí se ve este color en
      // vez del fondo del mail.
      //
      // Va el borde inferior y no el promedio de la rebanada: el hueco aparece
      // ABAJO, así que tiene que continuar lo que hay al pie. Con el promedio,
      // la celda de un botón blanco pintaba el hueco de blanco y dejaba una
      // línea clara colgando bajo la pastilla.
      const [r, g, b] = await sharp(slice)
        .extract({ left: 0, top: bottom - top - 1, width: right - left, height: 1 })
        .resize(1, 1, { fit: "fill" })
        .removeAlpha()
        .raw()
        .toBuffer();
      const bg = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

      cells.push({
        bg,
        url: urlDominioPropio(data.publicUrl),
        width: cellRight - cellLeft,
        link: dueno?.link ?? null,
        colspan: Math.max(1, idxMaster(x1) - idxMaster(x0)),
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
      // Las imágenes sueltas también tienen que salir por el dominio propio,
      // no solo las rebanadas del canvas.
      resultado.push(
        bloque.tipo === "imagen" ? { ...bloque, url: urlDominioPropio(bloque.url) } : bloque
      );
      continue;
    }

    // Sin zonas marcadas: la imagen viaja entera, sin cortar.
    if (!bloque.hotspots?.length) {
      resultado.push({ tipo: "imagen", url: urlDominioPropio(bloque.url), alt: bloque.alt });
      continue;
    }

    const rows = await cortarImagenConHotspots(supabase, campaniaId, i, bloque.url, bloque.hotspots);
    resultado.push({ tipo: "canvas-procesado", rows, alt: bloque.alt });
  }

  return resultado;
}
