'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { codificarFoto, medidaConTope } from '@/lib/comprimir-imagen';

interface Props {
  onUpload: (url: string) => void;
  bucket?: string;
  folder?: string;
  /** Lado más largo en px (no el ancho: las fotos de celular son verticales). */
  maxLado?: number;
  initialPreview?: string | null;
}

export function ImageUploader({ onUpload, bucket = 'flyers', folder, maxLado = 1920, initialPreview = null }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(initialPreview);

  const comprimir = (file: File): Promise<{ file: File; ext: string }> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('No se pudo leer la imagen'));
      };

      img.onload = async () => {
        URL.revokeObjectURL(objectUrl);
        const [w, h] = medidaConTope(img.width, img.height, maxLado);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);

        try {
          const { blob, ext, mime } = await codificarFoto(canvas);
          resolve({
            file: new File([blob], file.name.replace(/\.[^/.]+$/, `.${ext}`), { type: mime }),
            ext,
          });
        } catch (e) {
          reject(e);
        }
      };

      img.src = objectUrl;
    });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      // Achicar y comprimir antes de subir (ver lib/comprimir-imagen.ts)
      const { file: comprimida, ext } = await comprimir(file);

      const fileName = `${Math.random().toString(36).substring(2)}.${ext}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // 1. Subir al Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, comprimida);

      if (uploadError) throw uploadError;

      // 2. Obtener la URL pública
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

      // El archivo anterior NO se borra a propósito: una misma URL puede estar
      // referenciada desde varias tablas (la galería del cowork y Cultura
      // compartían fotos), y borrarla acá dejaba a la otra sección con la
      // imagen rota. Un huérfano en el bucket es más barato que eso.

      setPreview(data.publicUrl);
      onUpload(data.publicUrl);

    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      <label className="relative flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-zinc-200 rounded-3xl bg-zinc-50 hover:bg-zinc-100 hover:border-orange-300 transition-all cursor-pointer group overflow-hidden">
        
        {preview ? (
          <div className="absolute inset-0 w-full h-full">
            <img src={preview} className="w-full h-full object-cover opacity-80" alt="Preview" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload className="text-white" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-zinc-400 mb-2 group-hover:text-orange-500 transition-colors" />
                <p className="text-xs font-bold text-zinc-500 tracking-tighter uppercase">Soltá el arte acá</p>
                <p className="text-[9px] text-zinc-400 font-medium">Se comprime automáticamente</p>
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
      
      {preview && (
        <div className="mt-2 space-y-1">
          <p className="text-[10px] text-green-600 font-bold flex items-center gap-1">
            <CheckCircle2 size={12} /> IMAGEN LISTA PARA PUBLICAR
          </p>
          <p className="text-[9px] text-zinc-500 font-medium flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Optimizada para web
          </p>
        </div>
      )}
    </div>
  );
}