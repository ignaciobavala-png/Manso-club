'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  onUpload: (url: string) => void;
  bucket?: string;
  folder?: string;
  maxWidth?: number;
  className?: string;
  height?: string;
  /**
   * Recorta el margen transparente que rodea al dibujo. Para logos e iconos:
   * los exports de Figma/Illustrator suelen traer aire alfa alrededor, y como
   * el tamaño se aplica al archivo entero, ese margen se come el espacio y el
   * dibujo se ve más chico de lo pedido.
   */
  recortarAlfa?: boolean;
}

/** Alfa por debajo de esto cuenta como transparente al buscar el borde del dibujo. */
const UMBRAL_ALFA = 8;

export function CompactImageUploader({
  onUpload,
  bucket = 'flyers',
  folder,
  maxWidth = 1920,
  className = "",
  height = "h-16",
  recortarAlfa = false,
}: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /**
   * Los assets que van dentro de un mail NUNCA salen en WebP.
   *
   * Outlook de escritorio (motor Word) no renderiza WebP, y la variante que
   * produce el navegador para una imagen con transparencia es
   * `VP8X + ALPH + VP8` — con pérdida y el alfa en un chunk aparte, que es la
   * peor soportada de todas. El cliente que ignora ese chunk descarta la
   * transparencia y dibuja el rectángulo opaco: por eso los iconos del pie
   * aparecían con un fondo que no existe en el archivo.
   *
   * Se decide por bucket y no por prop para que no haya forma de olvidarlo al
   * sumar un upload nuevo al editor de campañas.
   */
  const esParaEmail = bucket === 'emails';

  /**
   * Redimensiona, opcionalmente recorta el alfa y elige el formato de salida.
   *
   * PNG si la imagen tiene transparencia, JPEG si no: es la misma regla que
   * aplica lib/email-canvas.ts al cortar las rebanadas del canvas, así que
   * todo lo que viaja en un mail sigue el mismo criterio.
   */
  const procesarImagen = (file: File): Promise<{ file: File; ext: string }> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      // Sin onerror, un archivo que el navegador no puede decodificar dejaba la
      // promesa colgada para siempre y el botón en "subiendo".
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('No se pudo leer la imagen'));
      };

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round(h * (maxWidth / w));
          w = maxWidth;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        // El barrido de píxeles solo hace falta para decidir el formato del mail
        // o para recortar. En una subida normal a WebP se saltea: sobre un flyer
        // de 1920px serían dos millones de iteraciones para nada.
        let tieneAlfa = false;
        let x0 = 0, y0 = 0, x1 = w - 1, y1 = h - 1;
        if (esParaEmail || recortarAlfa) {
          const { data } = ctx.getImageData(0, 0, w, h);
          x0 = w; y0 = h; x1 = -1; y1 = -1;
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const a = data[(y * w + x) * 4 + 3];
              if (a < 250) tieneAlfa = true;
              if (a > UMBRAL_ALFA) {
                if (x < x0) x0 = x;
                if (x > x1) x1 = x;
                if (y < y0) y0 = y;
                if (y > y1) y1 = y;
              }
            }
          }
        }

        // Recorte al dibujo real. Si la imagen es opaca el bbox da el archivo
        // entero y el recorte no hace nada, así que no hace falta condicionar.
        let salida = canvas;
        if (recortarAlfa && x1 >= x0 && y1 >= y0 && (x1 - x0 + 1 < w || y1 - y0 + 1 < h)) {
          const cw = x1 - x0 + 1;
          const ch = y1 - y0 + 1;
          const recortado = document.createElement('canvas');
          recortado.width = cw;
          recortado.height = ch;
          recortado.getContext('2d')!.drawImage(canvas, x0, y0, cw, ch, 0, 0, cw, ch);
          salida = recortado;
        }

        const [mime, ext, calidad] = esParaEmail
          ? tieneAlfa
            ? ['image/png', 'png', undefined]
            : ['image/jpeg', 'jpg', 0.92]
          : ['image/webp', 'webp', 0.85];

        salida.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('No se pudo convertir la imagen'));
              return;
            }
            resolve({
              file: new File([blob], file.name.replace(/\.[^/.]+$/, `.${ext}`), { type: mime }),
              ext,
            });
          },
          mime as string,
          calidad as number | undefined
        );
      };

      img.src = objectUrl;
    });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      setErrorMsg(null);
      const file = e.target.files?.[0];
      if (!file) return;

      const { file: procesada, ext } = await procesarImagen(file);

      // La extensión sale del formato real: antes se subía todo como .webp
      // aunque el contenido fuera otra cosa.
      const fileName = `${Math.random().toString(36).substring(2)}.${ext}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // 1. Subir al Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, procesada);

      if (uploadError) throw uploadError;

      // 2. Obtener la URL pública
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

      setPreview(data.publicUrl);
      onUpload(data.publicUrl);

    } catch (error) {
      console.error('Error uploading image:', error);
      setErrorMsg(error instanceof Error ? error.message : 'No se pudo subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <label className={`relative flex flex-col items-center justify-center w-full ${height} border-2 border-dashed border-manso-cream/20 rounded-xl bg-manso-cream/5 hover:bg-manso-cream/10 hover:border-manso-cream/40 transition-all cursor-pointer group overflow-hidden`}>
        
        {preview ? (
          <div className="absolute inset-0 w-full h-full">
            <img src={preview} className="w-full h-full object-cover opacity-60" alt="Preview" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload className="text-manso-cream" size={16} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            {isUploading ? (
              <Loader2 className="w-4 h-4 text-manso-terra animate-spin" />
            ) : (
              <>
                <Upload className="w-4 h-4 text-manso-cream/40 group-hover:text-manso-terra transition-colors" />
              </>
            )}
          </div>
        )}

        <input 
          type="file" 
          className="hidden" 
          accept="image/*" 
          onChange={handleUpload} 
          disabled={isUploading}
        />
      </label>
      
      {errorMsg ? (
        <p className="mt-1 text-[8px] text-red-400 font-medium">{errorMsg}</p>
      ) : preview && (
        <div className="mt-1">
          <p className="text-[8px] text-green-400 font-medium flex items-center gap-1">
            <CheckCircle2 size={8} /> Lista
          </p>
        </div>
      )}
    </div>
  );
}
