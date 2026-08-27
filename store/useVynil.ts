// store/useVynil.ts
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { buscarMetadata, parsearLink, type TemaVynil } from '@/lib/vynil';

/**
 * La playlist de Vynil es una sola para todo Manso y vive en la base. Este
 * store es la copia en memoria de esa lista más el estado de reproducción; no
 * persiste nada en el navegador, porque lo que se escucha no es "lo mío" sino
 * lo que fue dejando la gente.
 */
interface VynilStore {
  /** La playlist general, del último puesto al primero. */
  temas: TemaVynil[];
  cargado: boolean;
  /** Índice del tema sonando. */
  indice: number;
  sonando: boolean;

  cargar: () => Promise<void>;
  /** Pega un link, lo guarda en la playlist y lo deja sonando. */
  poner: (url: string) => Promise<{ ok: boolean; error?: string }>;
  setIndice: (i: number) => void;
  setSonando: (v: boolean) => void;
  siguiente: () => void;
  anterior: () => void;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function desdeFila(f: any): TemaVynil {
  return {
    id: f.id,
    fuente: f.fuente,
    ref: f.ref,
    titulo: f.titulo ?? undefined,
    autor: f.autor ?? undefined,
    thumb: f.thumb ?? undefined,
    puestoPor: f.puesto_por ?? undefined,
  };
}

export const useVynil = create<VynilStore>()((set, get) => ({
  temas: [],
  cargado: false,
  indice: 0,
  sonando: false,

  cargar: async () => {
    const { data, error } = await supabase
      .from('vynil_temas')
      .select('id, fuente, ref, titulo, autor, thumb, puesto_por')
      .eq('visible', true)
      .order('created_at', { ascending: false });

    if (error) {
      // Sin playlist el widget no se muestra; no vale romper la página.
      set({ cargado: true });
      return;
    }
    set({ temas: (data ?? []).map(desdeFila), cargado: true });
  },

  poner: async url => {
    const parseado = parsearLink(url);
    if (!parseado) return { ok: false, error: 'Pegá un link de YouTube o de SoundCloud.' };

    const yaEsta = get().temas.findIndex(t => t.fuente === parseado.fuente && t.ref === parseado.ref);
    if (yaEsta >= 0) {
      // Ya lo puso otro: en vez de un error seco, lo pone a sonar.
      set({ indice: yaEsta, sonando: true });
      return { ok: false, error: 'Ese tema ya estaba en la playlist. Va sonando.' };
    }

    // El título es un lujo, no un requisito: si el oEmbed falla, entra igual.
    const meta = await buscarMetadata(parseado);
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('vynil_temas')
      .insert({
        fuente: parseado.fuente,
        ref: parseado.ref,
        titulo: meta.titulo ?? null,
        autor: meta.autor ?? null,
        thumb: meta.thumb ?? null,
        user_id: user?.id ?? null,
        puesto_por: user?.user_metadata?.display_name ?? null,
      })
      .select('id, fuente, ref, titulo, autor, thumb, puesto_por')
      .single();

    if (error || !data) {
      return { ok: false, error: 'No se pudo guardar el tema. Probá de nuevo.' };
    }

    // Entra arriba de todo y arranca: el que lo puso lo escucha ya.
    set(state => ({ temas: [desdeFila(data), ...state.temas], indice: 0, sonando: true }));
    return { ok: true };
  },

  setIndice: i => set({ indice: i }),
  setSonando: v => set({ sonando: v }),

  siguiente: () => {
    const { temas } = get();
    if (temas.length === 0) return;
    set(state => ({ indice: (state.indice + 1) % temas.length }));
  },

  anterior: () => {
    const { temas } = get();
    if (temas.length === 0) return;
    set(state => ({ indice: (state.indice - 1 + temas.length) % temas.length }));
  },
}));
