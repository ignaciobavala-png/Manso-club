'use client';

import { useEffect } from 'react';
import { useCurrency } from '@/store/useCurrency';

export function CurrencyToggle({ claro = false }: { claro?: boolean }) {
  const { currency, setCurrency, fetchRate } = useCurrency();

  useEffect(() => { fetchRate(); }, [fetchRate]);

  return (
    <div className={`inline-flex items-center gap-1 p-1 rounded-full border ${claro ? 'bg-manso-black/5 border-manso-black/15' : 'bg-manso-cream/5 border-manso-cream/15'}`}>
      <button
        onClick={() => setCurrency('ARS')}
        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
          currency === 'ARS'
            ? 'bg-manso-terra text-manso-cream'
            : claro
              ? 'text-manso-black/50 hover:text-manso-black'
              : 'text-manso-cream/40 hover:text-manso-cream/70'
        }`}
      >
        ARS
      </button>
      <button
        onClick={() => setCurrency('USD')}
        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
          currency === 'USD'
            ? 'bg-manso-terra text-manso-cream'
            : claro
              ? 'text-manso-black/50 hover:text-manso-black'
              : 'text-manso-cream/40 hover:text-manso-cream/70'
        }`}
      >
        USD
      </button>
    </div>
  );
}
