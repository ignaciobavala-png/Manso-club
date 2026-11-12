import { NextResponse } from 'next/server';
import { adminFestival } from '@/lib/festival-compra';
import {
  CONTEO_CONFIG_POR_DEFECTO,
  CargaVisita,
  ConteoConfig,
  Dispositivo,
} from '@/lib/types/festival-conteo';

/**
 * Recibe lo que mide `ConteoVisitas` (navegador → sendBeacon). Es el único
 * camino de escritura: las tablas no tienen insert público. Valida todo, porque
 * lo que llega es input de cualquiera, y es idempotente: el navegador repite el
 * mismo `id` en cada heartbeat y acá se actualiza la misma fila.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp|curl|wget/i;
const MAX_BYTES = 8_000;

// La config cambia casi nunca y esto se llama cada pocos segundos por visitante.
let cacheConfig: { en: number; config: ConteoConfig } | null = null;

async function leerConfig(): Promise<ConteoConfig> {
  if (cacheConfig && Date.now() - cacheConfig.en < 30_000) return cacheConfig.config;
  const { data } = await adminFestival().from('festival_conteo_config').select('*').eq('id', 1).maybeSingle();
  const config: ConteoConfig = { ...CONTEO_CONFIG_POR_DEFECTO, ...(data ?? {}) };
  cacheConfig = { en: Date.now(), config };
  return config;
}

function dispositivo(ua: string): Dispositivo {
  if (/ipad|tablet/i.test(ua)) return 'tablet';
  if (/mobi|android|iphone/i.test(ua)) return 'movil';
  return 'escritorio';
}

/** Sin query ni hash, y los ids de orden pasan a ":id" para que agrupen. */
function normalizarPath(path: unknown): string | null {
  if (typeof path !== 'string' || path.length > 200) return null;
  const limpio = path.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  if (limpio !== '/blurfestival' && !limpio.startsWith('/blurfestival/')) return null;
  return limpio.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id');
}

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(request: Request) {
  // sendBeacon manda text/plain según el navegador, así que se parsea a mano.
  const crudo = await request.text();
  if (crudo.length > MAX_BYTES) return new NextResponse(null, { status: 413 });

  const ua = request.headers.get('user-agent') ?? '';
  if (!ua || BOT.test(ua)) return new NextResponse(null, { status: 204 });

  let c: Partial<CargaVisita>;
  try {
    c = JSON.parse(crudo);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const path = normalizarPath(c.path);
  if (
    !path ||
    typeof c.id !== 'string' || !UUID.test(c.id) ||
    typeof c.visitante !== 'string' || !UUID.test(c.visitante) ||
    typeof c.sesion !== 'string' || !UUID.test(c.sesion)
  ) {
    return new NextResponse(null, { status: 400 });
  }

  const cfg = await leerConfig();
  if (!cfg.activo) return new NextResponse(null, { status: 204 });
  if (cfg.rutas_excluidas.some(r => r && (path === r || path.startsWith(r.endsWith('/') ? r : `${r}/`)))) {
    return new NextResponse(null, { status: 204 });
  }

  const ms = Number.isFinite(c.ms) ? Math.max(0, Number(c.ms)) : 0;
  const segundos = cfg.contar_tiempo ? Math.min(Math.round(ms / 1000), cfg.tiempo_max_seg) : null;
  const clicks = cfg.contar_clicks ? Math.min(Math.max(0, Math.trunc(Number(c.clicks) || 0)), 5000) : 0;
  const idioma = texto(c.idioma, 5) || null;
  const origen = texto(c.origen, 120) || null;

  const supabase = adminFestival();
  const { error } = await supabase.from('festival_visitas').upsert(
    {
      id: c.id,
      visitante: c.visitante,
      sesion: c.sesion,
      path,
      dispositivo: dispositivo(ua),
      idioma,
      origen,
      segundos,
      clicks,
      actualizada: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
  if (error) {
    console.error('Conteo de visitas:', error.message);
    return new NextResponse(null, { status: 500 });
  }

  if (cfg.contar_clicks && cfg.clicks_max_por_vista > 0 && Array.isArray(c.detalle)) {
    const filas = c.detalle
      .filter(d => d && Number.isInteger(d.n) && d.n >= 0 && d.n < cfg.clicks_max_por_vista && texto(d.e, 90))
      .slice(0, cfg.clicks_max_por_vista)
      .map(d => ({ visita_id: c.id, n: d.n, path, elemento: texto(d.e, 90) }));
    if (filas.length) {
      const { error: errorClicks } = await supabase
        .from('festival_clicks')
        .upsert(filas, { onConflict: 'visita_id,n', ignoreDuplicates: true });
      if (errorClicks) console.error('Conteo de clicks:', errorClicks.message);
    }
  }

  return new NextResponse(null, { status: 204 });
}
