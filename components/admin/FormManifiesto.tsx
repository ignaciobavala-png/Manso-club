'use client';

import { useState, useEffect } from 'react';
import { getManifiesto, updateManifiesto } from '@/lib/manifiesto';
import { ImageUploader } from './ImageUploader';
import { AlertCircle, CheckCircle, X, FileText, Trash2 } from 'lucide-react';

export function FormManifiesto() {
  const [id, setId] = useState<string | null>(null);
  const [contenido, setContenido] = useState('');
  const [slide1Imagen, setSlide1Imagen] = useState<string | null>(null);
  const [slide1Frase, setSlide1Frase] = useState('');
  const [slide2Imagen, setSlide2Imagen] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getManifiesto().then((data) => {
      setId(data.id);
      setContenido(data.contenido);
      setSlide1Imagen(data.slide1_imagen);
      setSlide1Frase(data.slide1_frase ?? '');
      setSlide2Imagen(data.slide2_imagen);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateManifiesto(id, {
        contenido: contenido.trim(),
        slide1_imagen: slide1Imagen,
        slide1_frase: slide1Frase,
        slide2_imagen: slide2Imagen,
      });
      await fetch('/api/revalidate-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'manifiesto' }),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="bg-manso-cream/5 p-4 md:p-6 rounded-[2rem] border border-manso-cream/10 shadow-xl">
      <div className="mb-5">
        <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter text-manso-cream mb-1">
          Editar Manifiesto
        </h2>
        <p className="text-xs text-manso-cream/60">
          Primero las dos placas que abren la página, después el texto. Cada párrafo va separado
          por una línea en blanco y se publica tal cual lo escribís.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <AlertCircle className="text-red-400 flex-shrink-0" size={16} />
          <p className="text-red-300 text-xs flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X size={14} />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
          <CheckCircle className="text-green-400 flex-shrink-0" size={16} />
          <p className="text-green-300 text-xs flex-1">¡Manifiesto actualizado!</p>
          <button onClick={() => setSuccess(false)} className="text-green-400 hover:text-green-300">
            <X size={14} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Placa 1: imagen de fondo con una frase encima */}
        <div className="p-4 rounded-2xl border border-manso-cream/10 bg-manso-cream/5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-manso-cream">
                Placa 1 — imagen con frase
              </h3>
              <p className="text-[10px] text-manso-cream/40 mt-0.5">
                La frase va centrada encima de la imagen.
              </p>
            </div>
            {slide1Imagen && (
              <button
                type="button"
                onClick={() => setSlide1Imagen(null)}
                className="shrink-0 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-manso-cream/40 hover:text-red-400 transition-colors"
              >
                <Trash2 size={12} /> Quitar
              </button>
            )}
          </div>

          <ImageUploader
            bucket="flyers"
            folder="manifiesto"
            initialPreview={slide1Imagen}
            onUpload={setSlide1Imagen}
          />

          <textarea
            value={slide1Frase}
            onChange={(e) => setSlide1Frase(e.target.value)}
            placeholder="La frase que va sobre la imagen"
            className="w-full bg-manso-cream/10 p-3 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-medium text-manso-cream placeholder:text-manso-cream/30 transition-all resize-none min-h-[80px] text-sm leading-relaxed"
          />
        </div>

        {/* Placa 2: solo la imagen */}
        <div className="p-4 rounded-2xl border border-manso-cream/10 bg-manso-cream/5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-manso-cream">
                Placa 2 — solo imagen
              </h3>
              <p className="text-[10px] text-manso-cream/40 mt-0.5">
                Sin texto encima.
              </p>
            </div>
            {slide2Imagen && (
              <button
                type="button"
                onClick={() => setSlide2Imagen(null)}
                className="shrink-0 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-manso-cream/40 hover:text-red-400 transition-colors"
              >
                <Trash2 size={12} /> Quitar
              </button>
            )}
          </div>

          <ImageUploader
            bucket="flyers"
            folder="manifiesto"
            initialPreview={slide2Imagen}
            onUpload={setSlide2Imagen}
          />
        </div>

        <div className="relative">
          <FileText className="absolute left-3 top-3 text-manso-cream/40" size={16} />
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            placeholder={`Escribí el manifiesto acá...\n\nCada párrafo separado por una línea en blanco.`}
            className="w-full bg-manso-cream/10 p-3 pl-9 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-medium text-manso-cream placeholder:text-manso-cream/30 transition-all resize-none min-h-[420px] text-sm leading-relaxed"
          />
        </div>
        <p className="text-[10px] text-manso-cream/30 text-right">
          {contenido.length} caracteres
        </p>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-manso-terra text-manso-cream py-3 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50 text-sm"
        >
          {loading ? 'GUARDANDO...' : 'PUBLICAR MANIFIESTO'}
        </button>
      </form>
    </div>
  );
}
