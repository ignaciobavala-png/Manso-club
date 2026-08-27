/**
 * Compresión de video en el navegador, sin dependencias.
 *
 * Por qué existe: el banner del home se sirve desde Supabase Storage en plan
 * gratuito (límite de 50MB por archivo y transferencia acotada), y un video
 * exportado de cualquier editor pesa fácil 80–300MB. Antes se subía el archivo
 * crudo: si pasaba de 50MB, Supabase lo rechazaba y el panel mostraba un
 * "Error al subir el video" sin explicar nada.
 *
 * Cómo: se reproduce el video, se dibuja cada frame en un canvas ya escalado y
 * se graba el `captureStream()` del canvas con MediaRecorder. El audio se
 * descarta a propósito — el hero se reproduce siempre `muted`, así que es peso
 * puro. Es una recompresión en tiempo real: un clip de 20s tarda ~20s.
 */

export interface CompressOptions {
  /** Ancho máximo de salida. El alto se deriva manteniendo el aspecto. */
  maxWidth?: number;
  /** Por debajo de este peso no se recomprime (si además ya entra en maxWidth). */
  targetBytes?: number;
  /** 0..1, para mostrar avance en la UI. */
  onProgress?: (progress: number) => void;
}

export interface CompressResult {
  file: File;
  /** false = se devolvió el original, porque ya estaba bien o no se pudo recomprimir. */
  compressed: boolean;
  originalBytes: number;
}

/** Límite por archivo de Supabase Storage en el plan gratuito. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_TARGET_BYTES = 8 * 1024 * 1024;

/** mp4 primero: lo entienden todos los navegadores. webm es el plan B. */
const MIME_CANDIDATES = [
  'video/mp4;codecs=avc1.42E01E',
  'video/mp4',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
];

function pickMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  return MIME_CANDIDATES.find((mime) => MediaRecorder.isTypeSupported(mime)) ?? null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function loadVideo(file: File): Promise<{ video: HTMLVideoElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = url;
    video.onloadedmetadata = () => resolve({ video, url });
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer el video'));
    };
  });
}

/**
 * Bitrate objetivo según la cantidad de píxeles. ~2.4 Mbps para 1080p,
 * proporcional para resoluciones menores. Alcanza de sobra para un fondo
 * que va detrás de un velo negro al 40%.
 */
function targetBitrate(width: number, height: number): number {
  const pixels = width * height;
  const perPixel = 2_400_000 / (1920 * 1080);
  return Math.max(600_000, Math.round(pixels * perPixel));
}

export async function compressVideo(
  file: File,
  { maxWidth = DEFAULT_MAX_WIDTH, targetBytes = DEFAULT_TARGET_BYTES, onProgress }: CompressOptions = {}
): Promise<CompressResult> {
  const originalBytes = file.size;
  const mimeType = pickMimeType();

  if (!mimeType) {
    return { file, compressed: false, originalBytes };
  }

  let video: HTMLVideoElement;
  let url: string;
  try {
    ({ video, url } = await loadVideo(file));
  } catch {
    return { file, compressed: false, originalBytes };
  }

  const cleanup = () => {
    video.pause();
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  };

  const srcWidth = video.videoWidth;
  const srcHeight = video.videoHeight;
  const duration = video.duration;

  // Ya está liviano y en resolución razonable: no vale la pena recomprimir
  // (una segunda pasada sólo agrega artefactos).
  if (!srcWidth || !srcHeight || !isFinite(duration) || duration <= 0) {
    cleanup();
    return { file, compressed: false, originalBytes };
  }
  if (originalBytes <= targetBytes && srcWidth <= maxWidth) {
    cleanup();
    return { file, compressed: false, originalBytes };
  }

  const scale = Math.min(1, maxWidth / srcWidth);
  // Los codecs de video quieren dimensiones pares.
  const outWidth = Math.max(2, Math.round((srcWidth * scale) / 2) * 2);
  const outHeight = Math.max(2, Math.round((srcHeight * scale) / 2) * 2);

  const canvas = document.createElement('canvas');
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    cleanup();
    return { file, compressed: false, originalBytes };
  }

  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: targetBitrate(outWidth, outHeight),
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recorded = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    recorder.onerror = () => reject(new Error('Falló la compresión del video'));
  });

  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    stream.getTracks().forEach((track) => track.stop());
    if (recorder.state !== 'inactive') recorder.stop();
  };

  const drawFrame = () => {
    if (stopped) return;
    ctx.drawImage(video, 0, 0, outWidth, outHeight);
    onProgress?.(Math.min(0.99, video.currentTime / duration));
    if (video.ended) {
      stop();
      return;
    }
    requestAnimationFrame(drawFrame);
  };

  video.onended = stop;
  recorder.start();

  try {
    video.currentTime = 0;
    await video.play();
  } catch {
    stop();
    cleanup();
    return { file, compressed: false, originalBytes };
  }

  requestAnimationFrame(drawFrame);

  let blob: Blob;
  try {
    blob = await recorded;
  } catch {
    cleanup();
    return { file, compressed: false, originalBytes };
  } finally {
    cleanup();
  }

  onProgress?.(1);

  // Si la recompresión no achicó nada (pasa con clips ya muy optimizados),
  // conviene quedarse con el original.
  if (blob.size === 0 || blob.size >= originalBytes) {
    return { file, compressed: false, originalBytes };
  }

  const ext = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
  const baseName = file.name.replace(/\.[^/.]+$/, '') || 'video';
  const outType = ext === 'mp4' ? 'video/mp4' : 'video/webm';

  return {
    file: new File([blob], `${baseName}.${ext}`, { type: outType }),
    compressed: true,
    originalBytes,
  };
}
