import { create } from 'zustand';

interface CurrencyStore {
  currency: 'USD' | 'ARS';
  rate: number | null;   // ARS por 1 USD (dólar blue venta)
  fetched: boolean;
  setCurrency: (c: 'USD' | 'ARS') => void;
  fetchRate: () => Promise<void>;
}

export const useCurrency = create<CurrencyStore>((set, get) => ({
  currency: 'USD',
  rate: null,
  fetched: false,

  setCurrency: (currency) => set({ currency }),

  fetchRate: async () => {
    if (get().fetched) return;
    try {
      const res = await fetch('/api/dolar');
      if (!res.ok) throw new Error();
      const data = await res.json();
      set({ rate: data.venta, fetched: true });
    } catch {
      set({ fetched: true }); // no reintentar en errores
    }
  },
}));
