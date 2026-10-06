import { supabase } from '@/lib/supabase';

/** Estilos y ayudas que comparten `FestivalAdmin` y `FestivalLineupAdmin`. */

export const INPUT =
  'w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-4 py-3 text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra/50 transition-colors';
export const LABEL = 'text-[10px] font-black uppercase tracking-widest text-manso-cream/60 mb-2 block';
export const CARD = 'bg-manso-cream/5 border border-manso-cream/10 rounded-2xl p-4 space-y-4';
export const TITULO = 'text-[10px] font-black uppercase tracking-[0.2em] text-manso-cream';
export const AYUDA = 'text-[11px] text-manso-cream/40 mt-1 leading-relaxed';
export const BOTON_ICONO =
  'w-8 h-8 flex items-center justify-center rounded-lg text-manso-cream/40 hover:text-manso-cream hover:bg-manso-cream/10 transition-colors disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-manso-cream/40';
export const BOTON_GUARDAR =
  'flex items-center gap-2 px-4 py-2 rounded-xl bg-manso-terra/20 text-manso-terra text-[9px] font-black uppercase tracking-widest hover:bg-manso-terra/30 transition-colors disabled:opacity-40';
export const BOTON_AGREGAR =
  'w-full flex items-center justify-center gap-2 py-3 border border-dashed border-manso-terra/30 rounded-2xl text-[9px] font-black uppercase tracking-widest text-manso-terra/60 hover:text-manso-terra hover:border-manso-terra/60 hover:bg-manso-terra/5 transition-all';

export type TablaFestival = 'festival_escenarios' | 'festival_entradas' | 'festival_artistas' | 'festival_faq';

/** Intercambia una fila con su vecina y renumera toda la lista desde 0. */
export async function moverFila(tabla: TablaFestival, filas: { id: string }[], indice: number, delta: number) {
  const destino = indice + delta;
  if (destino < 0 || destino >= filas.length) return;

  const reordenadas = [...filas];
  [reordenadas[indice], reordenadas[destino]] = [reordenadas[destino], reordenadas[indice]];
  await Promise.all(reordenadas.map((fila, i) => supabase.from(tabla).update({ orden: i }).eq('id', fila.id)));
}

export const siguienteOrden = (filas: { orden: number }[]) =>
  filas.reduce((max, f) => Math.max(max, f.orden), -1) + 1;
