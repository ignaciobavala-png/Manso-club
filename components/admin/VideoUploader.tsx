'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, Loader2, CheckCircle2, Film } from 'lucide-react';
import { compressVideo, formatBytes, MAX_UPLOAD_BYTES } from '@/lib/video-compress';

interface Props {
  onUpload: (url: string) => void;
  bucket?: string;
  folder?: string;
  initialPreview?: string | null;
}

function extractStoragePath(url: string, bucket: string): string | null {
  const marker = `/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}

export function VideoUploader({ onUpload, bucket = 'hero-media', folder = 'videos', initialPreview = null }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(initialPreview);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSavedNote(null);

    try {
      // Se comprime siempre antes de mirar el tamaño: la mayoría de los videos
      // que exporta un editor pasan de 50MB y sin esta pasada Supabase los
      // rechaza en el plan gratuito.
      setStatus('Comprimiendo… 0%');
      const { file: outFile, compressed, originalBytes } = await compressVideo(file, {
        onProgress: (p) => setStatus(`Comprimiendo… ${Math.round(p * 100)}%`),
      });

      if (outFile.size > MAX_UPLOAD_BYTES) {
        setError(
          `El video pesa ${formatBytes(outFile.size)} y el máximo es ${formatBytes(MAX_UPLOAD_BYTES)}. ` +
          `Recortalo o exportalo más corto (ideal: menos de 20 segundos, 1080p).`
        );
        return;
      }

      setStatus('Subiendo…');

      const ext = outFile.name.split('.').pop() || 'mp4';
      const fileName = `${Math.random().toString(36).substring(2)}.${ext}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, outFile, { contentType: outFile.type });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

      // Borrar el archivo anterior (si había uno en este mismo bucket) para no dejar huérfanos
      const oldPath = preview ? extractStoragePath(preview, bucket) : null;
      if (oldPath) {
        supabase.storage.from(bucket).remove([oldPath]).catch(() => {});
      }

      setPreview(data.publicUrl);
      setSavedNote(
        compressed
          ? `Comprimido: ${formatBytes(originalBytes)} → ${formatBytes(outFile.size)}`
          : `Subido sin comprimir (${formatBytes(outFile.size)})`
      );
      onUpload(data.publicUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(`No se pudo subir el video: ${message}`);
    } finally {
      setStatus(null);
      setIsUploading(false);
      // Permite volver a elegir el mismo archivo después de un error.
      input.value = '';
    }
  };

  return (
    <div className="w-full">
      <label className={`relative flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-manso-cream/20 rounded-3xl bg-manso-cream/5 hover:bg-manso-cream/10 hover:border-manso-terra/50 transition-all cursor-pointer group overflow-hidden ${isUploading ? 'pointer-events-none' : ''}`}>
        {isUploading ? (
          <div className="flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-manso-terra animate-spin" />
            <p className="text-xs font-bold text-manso-cream/70 tracking-tighter uppercase">{status ?? 'Procesando…'}</p>
            <p className="text-[9px] text-manso-cream/30 font-medium">No cierres esta ventana</p>
          </div>
        ) : preview ? (
          <div className="absolute inset-0 w-full h-full">
            <video
              src={preview}
              className="w-full h-full object-cover opacity-80"
              muted
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload className="text-white" size={24} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Film className="w-8 h-8 text-manso-cream/40 mb-2 group-hover:text-manso-terra transition-colors" />
            <p className="text-xs font-bold text-manso-cream/60 tracking-tighter uppercase">Soltá el video acá</p>
            <p className="text-[9px] text-manso-cream/30 font-medium">MP4, WebM — se comprime solo antes de subir</p>
          </div>
        )}

        <input
          type="file"
          className="hidden"
          accept="video/mp4,video/webm,video/ogg,video/quicktime"
          onChange={handleUpload}
          disabled={isUploading}
        />
      </label>

      {error && (
        <p className="mt-2 text-[10px] text-manso-terra font-bold leading-relaxed">{error}</p>
      )}

      {!error && preview && !isUploading && (
        <div className="mt-2 space-y-1">
          <p className="text-[10px] text-manso-cream font-bold flex items-center gap-1">
            <CheckCircle2 size={12} /> VIDEO LISTO PARA PUBLICAR
          </p>
          {savedNote && <p className="text-[9px] text-manso-cream/40 font-medium">{savedNote}</p>}
        </div>
      )}
    </div>
  );
}
