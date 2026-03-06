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
}

export function CompactImageUploader({ 
  onUpload, 
  bucket = 'flyers', 
  folder, 
  maxWidth = 1920,
  className = "",
  height = "h-16"
}: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const convertToWebP = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        let w = img.width;
        let h = img.height;

        if (w > maxWidth) {
          h = Math.round(h * (maxWidth / w));
          w = maxWidth;
        }

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        
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
      const filePath = folder ? `${folder}/${fileName}` : fileName;

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
      console.error('Error uploading image:', error);
      // Mostrar error más sutil
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
      
      {preview && (
        <div className="mt-1">
          <p className="text-[8px] text-green-400 font-medium flex items-center gap-1">
            <CheckCircle2 size={8} /> Lista
          </p>
        </div>
      )}
    </div>
  );
}
