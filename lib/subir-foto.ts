import { supabase } from '@/lib/supabase';
import { codificarFoto, medidaConTope } from '@/lib/comprimir-imagen';

/**
 * Comprime y sube una foto a Supabase Storage; devuelve la URL pública.
 *
 * Es el mismo camino que `CompactImageUploader` fuera del mail, sacado acá
 * para las galerías que suben varias de una vez (`GaleriaFotosAdmin`).
 */
export async function subirFoto(
  file: File,
  { bucket, folder, maxLado }: { bucket: string; folder?: string; maxLado: number }
): Promise<string> {
  const img = await decodificar(file);
  const [w, h] = medidaConTope(img.width, img.height, maxLado);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);

  const { blob, ext, mime } = await codificarFoto(canvas);
  const nombre = `${Math.random().toString(36).substring(2)}.${ext}`;
  const ruta = folder ? `${folder}/${nombre}` : nombre;

  const { error } = await supabase.storage.from(bucket).upload(ruta, blob, { contentType: mime });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(ruta).data.publicUrl;
}

function decodificar(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`No se pudo leer ${file.name}`));
    };
    img.src = url;
  });
}
