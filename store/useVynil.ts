// store/useVynil.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { VYNIL_MAX_TEMAS, type TemaVynil } from '@/lib/vynil';

interface VynilStore {
  /** El mix que armó esta persona en este navegador. */
  temas: TemaVynil[];
  /** Mix que llegó por link de otro. Manda sobre el propio mientras esté puesto. */
  mixInvitado: TemaVynil[] | null;
  autorInvitado: string | null;
  /** Índice del tema sonando dentro del mix activo. */
  indice: number;
  sonando: boolean;

  agregar: (tema: TemaVynil) => boolean;
  quitar: (ref: string) => void;
  limpiar: () => void;
  ponerInvitado: (temas: TemaVynil[], autor?: string | null) => void;
  salirDeInvitado: () => void;
  setIndice: (i: number) => void;
  setSonando: (v: boolean) => void;
  siguiente: () => void;
  anterior: () => void;
  /** El mix que está sonando: el del invitado si hay, si no el propio. */
  activo: () => TemaVynil[];
}

export const useVynil = create<VynilStore>()(
  persist(
    (set, get) => ({
      temas: [],
      mixInvitado: null,
      autorInvitado: null,
      indice: 0,
      sonando: false,

      agregar: tema => {
        const { temas } = get();
        if (temas.length >= VYNIL_MAX_TEMAS) return false;
        if (temas.some(t => t.ref === tema.ref)) return false;
        set({ temas: [...temas, tema] });
        return true;
      },

      quitar: ref =>
        set(state => {
          const temas = state.temas.filter(t => t.ref !== ref);
          return { temas, indice: Math.min(state.indice, Math.max(temas.length - 1, 0)) };
        }),

      limpiar: () => set({ temas: [], indice: 0, sonando: false }),

      ponerInvitado: (temas, autor = null) =>
        set({ mixInvitado: temas, autorInvitado: autor, indice: 0, sonando: false }),

      salirDeInvitado: () =>
        set({ mixInvitado: null, autorInvitado: null, indice: 0, sonando: false }),

      setIndice: i => set({ indice: i }),
      setSonando: v => set({ sonando: v }),

      siguiente: () => {
        const lista = get().activo();
        if (lista.length === 0) return;
        set(state => ({ indice: (state.indice + 1) % lista.length }));
      },

      anterior: () => {
        const lista = get().activo();
        if (lista.length === 0) return;
        set(state => ({ indice: (state.indice - 1 + lista.length) % lista.length }));
      },

      activo: () => get().mixInvitado ?? get().temas,
    }),
    {
      name: 'manso-vynil',
      // El mix de otro no se persiste: llega por URL y se va al recargar sin el
      // parámetro. Solo se guarda lo que la persona armó.
      partialize: state => ({ temas: state.temas }),
    },
  ),
);
