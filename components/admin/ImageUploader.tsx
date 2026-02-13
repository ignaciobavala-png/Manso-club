'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  onUpload: (url: string) => void;
  bucket?: string;
}

export function ImageUploader({ onUpload, bucket = 'flyers' }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const convertToWebP = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          const webpFile = new File([blob!], file.name.replace(/\.[^/.]+$/, '.webp'), {
            type: 'image/webp'
          });
          resolve(webpFile);
        }, 'image/webp', 0.85);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      // Convertir a WebP antes de subir
      const webpFile = await convertToWebP(file);

      // Crear un nombre único para el archivo WebP
      const fileName = `${Math.random().toString(36).substring(2)}.webp`;
      const filePath = `${fileName}`;

      // 1. Subir al Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, webpFile);

      if (uploadError) throw uploadError;

      // 2. Obtener la URL pública
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      
      setPreview(data.publicUrl);
      onUpload(data.publicUrl);

    } catch (error) {
      console.error('Error subiendo:', error);
      alert('Error al subir la imagen');
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
                <p className="text-[9px] text-zinc-400 font-medium">Se convertirá a WebP automáticamente</p>
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
            Optimizada a WebP (85% calidad)
          </p>
        </div>
      )}
    </div>
  );
}