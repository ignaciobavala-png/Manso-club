'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

interface DolarData {
  compra: number;
  venta: number;
  nombre: string;
  fechaActualizacion: string;
}

export function DolarWidget() {
  const [data, setData] = useState<DolarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/dolar');
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const fmt = (n: number) =>
    n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-manso-cream/5 border border-manso-cream/15 text-xs">
      <span className="text-[9px] font-black uppercase tracking-[0.4em] text-manso-terra">
        Dólar Blue
      </span>

      {loading ? (
        <span className="text-manso-cream/30 animate-pulse">Cargando…</span>
      ) : error ? (
        <span className="text-manso-cream/30">No disponible</span>
      ) : data ? (
        <span className="text-manso-cream/80 font-light">
          Compra{' '}
          <span className="font-bold text-manso-cream">${fmt(data.compra)}</span>
          {' · '}
          Venta{' '}
          <span className="font-bold text-manso-cream">${fmt(data.venta)}</span>
        </span>
      ) : null}

      <button
        onClick={fetch_}
        disabled={loading}
        aria-label="Actualizar cotización"
        className="text-manso-cream/30 hover:text-manso-terra transition-colors disabled:opacity-30"
      >
        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
      </button>
    </div>
  );
}
