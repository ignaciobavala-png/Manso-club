'use client';

import { useState, useEffect } from 'react';
import { getManifiesto, updateManifiesto } from '@/lib/manifiesto';
import { AlertCircle, CheckCircle, X, FileText } from 'lucide-react';

export function FormManifiesto() {
  const [id, setId] = useState<string | null>(null);
  const [contenido, setContenido] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getManifiesto().then((data) => {
      setId(data.id);
      setContenido(data.contenido);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateManifiesto(id, contenido.trim());
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/manifiesto' }),
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
          Escribí cada párrafo separado por una línea en blanco. El texto se publicará tal cual lo escribís.
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

      <form onSubmit={handleSubmit} className="space-y-4">
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
