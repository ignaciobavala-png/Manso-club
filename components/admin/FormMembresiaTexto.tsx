'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle, X, FileText } from 'lucide-react';

export function FormMembresiaTexto() {
  const [id, setId] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase
      .from('membresias_config')
      .select('*')
      .single()
      .then(({ data }) => {
        if (data) {
          setId(data.id);
          setTexto(data.texto_intro || '');
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error: err } = await supabase
      .from('membresias_config')
      .update({ texto_intro: texto.trim(), updated_at: new Date().toISOString() })
      .eq('id', id);

    if (err) {
      setError(err.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }

    setLoading(false);
  };

  return (
    <div className="bg-manso-cream/5 p-4 md:p-6 rounded-[2rem] border border-manso-cream/10 shadow-xl">
      <div className="mb-5">
        <h2 className="text-lg font-black uppercase tracking-tighter text-manso-cream mb-1">
          Texto Introductorio
        </h2>
        <p className="text-xs text-manso-cream/60">
          Texto que aparece arriba de los planes. Se publica tal cual lo escribís.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <AlertCircle className="text-red-400 flex-shrink-0" size={16} />
          <p className="text-red-300 text-xs flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300"><X size={14} /></button>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
          <CheckCircle className="text-green-400 flex-shrink-0" size={16} />
          <p className="text-green-300 text-xs flex-1">¡Texto actualizado!</p>
          <button onClick={() => setSuccess(false)} className="text-green-400 hover:text-green-300"><X size={14} /></button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <FileText className="absolute left-3 top-3 text-manso-cream/40" size={16} />
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribí el texto introductorio de membresías acá..."
            className="w-full bg-manso-cream/10 p-3 pl-9 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-medium text-manso-cream placeholder:text-manso-cream/30 transition-all resize-none min-h-[200px] text-sm leading-relaxed"
          />
        </div>
        <p className="text-[10px] text-manso-cream/30 text-right">{texto.length} caracteres</p>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-manso-terra text-manso-cream py-3 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50 text-sm"
        >
          {loading ? 'GUARDANDO...' : 'GUARDAR TEXTO'}
        </button>
      </form>
    </div>
  );
}
