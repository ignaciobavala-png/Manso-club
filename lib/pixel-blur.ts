/**
 * Píxel de Meta propio de BLUR (/blurfestival). El del root layout es el de
 * Manso y también corre acá (carga fbevents.js); este se suma como segundo
 * píxel con `init`, y todo va con `trackSingle` para que cada píxel cuente solo
 * lo suyo.
 *
 * Por qué hay un helper: `trackSingle` sobre un píxel que todavía no tuvo `init`
 * se pierde en silencio, y el script del root (afterInteractive) puede llegar
 * después de que React hidrata. Cada evento espera a que `fbq` exista y a que
 * `<PixelBlur />` haya activado el píxel (el borrador y los admins no se miden:
 * ahí no se activa y nada sale).
 */
export const PIXEL_BLUR = '999072999344305';

type Fbq = (...args: unknown[]) => void;
type Ventana = Window & { fbq?: Fbq; __pixelBlur?: boolean };

export type EventoBlur = 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase';

export interface ParamsEvento {
  value?: number;
  currency?: 'ARS';
  content_ids?: string[];
  content_name?: string;
  content_type?: 'product';
  num_items?: number;
  contents?: { id: string; quantity: number; item_price?: number }[];
}

let activo = false;

/** Lo llama `<PixelBlur />` al montar: a partir de acá se puede medir. */
export function activarPixelBlur(estado: boolean) {
  activo = estado;
}

function listo(): boolean {
  const w = window as Ventana;
  if (!w.fbq || !activo) return false;
  if (!w.__pixelBlur) {
    w.fbq('init', PIXEL_BLUR);
    w.__pixelBlur = true;
  }
  return true;
}

/**
 * Manda un evento al píxel de BLUR. Resuelve `true` si salió; `false` si el
 * píxel no estuvo disponible en 10 s (adblock, borrador, admin). `eventID`
 * sirve para deduplicar contra la API de conversiones si algún día se suma.
 */
export function pixelBlur(evento: EventoBlur, params?: ParamsEvento, eventID?: string): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  const w = window as Ventana;
  const enviar = () => {
    if (!listo()) return false;
    w.fbq!('trackSingle', PIXEL_BLUR, evento, params ?? {}, eventID ? { eventID } : undefined);
    return true;
  };
  if (enviar()) return Promise.resolve(true);
  return new Promise(resolve => {
    const t = setInterval(() => {
      if (enviar()) {
        clearInterval(t);
        clearTimeout(corte);
        resolve(true);
      }
    }, 300);
    const corte = setTimeout(() => {
      clearInterval(t);
      resolve(false);
    }, 10000);
  });
}
