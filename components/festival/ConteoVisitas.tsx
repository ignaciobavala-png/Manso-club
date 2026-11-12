'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { CargaVisita, ConteoConfig } from '@/lib/types/festival-conteo';

/**
 * Medidor de /blurfestival: por cada pantalla cuenta el tiempo y los clicks y se lo
 * manda a /api/festival/visitas. No renderiza nada.
 *
 * Tiempo: corre solo mientras la pestaña está a la vista (si el panel lo pide)
 * y se corta tras `inactividad_seg` sin actividad, para no contar al que dejó
 * la pestaña abierta. Se manda cada `heartbeat_seg`, y al ocultarse, cerrarse o
 * cambiar de pantalla. El servidor guarda el último valor de cada vista.
 *
 * Privacidad: ids al azar en el navegador, sin IP, sin cookies. El texto de un
 * click se corta a 60 caracteres y los campos de formulario no se leen nunca.
 */

const URL_API = '/api/festival/visitas';
const CLAVE_VISITANTE = 'fest-v';
const CLAVE_SESION = 'fest-s';

const uuid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
        (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16)
      );

/** Un id que sobrevive según `almacen`; sin storage (modo privado) vale por carga. */
function idPersistente(almacen: 'local' | 'session', clave: string): string {
  try {
    const s = almacen === 'local' ? window.localStorage : window.sessionStorage;
    const guardado = s.getItem(clave);
    if (guardado) return guardado;
    const nuevo = uuid();
    s.setItem(clave, nuevo);
    return nuevo;
  } catch {
    return uuid();
  }
}

/** Qué se tocó, en una frase corta. `data-conteo="..."` en el JSX manda sobre todo. */
function describir(destino: EventTarget | null): string {
  const el = destino instanceof Element ? destino : null;
  const clicable = el?.closest('[data-conteo], a, button, [role="button"], summary, label');
  if (!clicable) return '(fondo)';

  const nombre = clicable.getAttribute('data-conteo');
  if (nombre) return nombre.slice(0, 60);

  const tipo = clicable.tagName === 'A' ? 'link' : 'boton';
  const aria = clicable.getAttribute('aria-label');
  // innerText del elemento y no de los inputs: nunca se lee lo que escribe la persona.
  const visible = clicable instanceof HTMLElement ? clicable.innerText : clicable.textContent;
  const etiqueta = (aria || visible || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (etiqueta) return `${tipo}: ${etiqueta}`;

  const href = clicable.getAttribute('href');
  return href ? `${tipo}: ${href.slice(0, 60)}` : `${tipo}: (sin texto)`;
}

export function ConteoVisitas({ config, idioma }: { config: ConteoConfig; idioma: string }) {
  const pathname = usePathname();

  useEffect(() => {
    const { contar_clicks, contar_tiempo, solo_pestana_visible, inactividad_seg, heartbeat_seg, clicks_max_por_vista } =
      config;
    if (config.rutas_excluidas.some(r => r && (pathname === r || pathname.startsWith(r.endsWith('/') ? r : `${r}/`)))) {
      return;
    }

    const id = uuid();
    const visitante = idPersistente('local', CLAVE_VISITANTE);
    const sesion = idPersistente('session', CLAVE_SESION);
    const primeraDeLaSesion = !yaHuboPantalla();

    // Origen: solo el dominio, y solo si vino de otro sitio.
    let origen: string | undefined;
    if (primeraDeLaSesion && document.referrer) {
      try {
        const host = new URL(document.referrer).host;
        if (host && host !== window.location.host) origen = host;
      } catch {
        // referrer mal formado: sin origen.
      }
    }

    let acumulado = 0;
    let corriendoDesde: number | null = null;
    let ultimaActividad = Date.now();
    let clicks = 0;
    const detalle: { n: number; e: string }[] = [];
    let enviadosDetalle = 0;

    const puedeCorrer = () => !solo_pestana_visible || document.visibilityState === 'visible';

    const reanudar = () => {
      if (corriendoDesde === null && puedeCorrer()) corriendoDesde = Date.now();
    };
    const pausar = (hasta = Date.now()) => {
      if (corriendoDesde !== null) {
        acumulado += Math.max(0, hasta - corriendoDesde);
        corriendoDesde = null;
      }
    };
    const msActuales = () => acumulado + (corriendoDesde !== null ? Date.now() - corriendoDesde : 0);

    const enviar = () => {
      const carga: CargaVisita = {
        id,
        visitante,
        sesion,
        path: pathname,
        idioma,
        origen,
        ms: contar_tiempo ? msActuales() : 0,
        clicks,
        detalle: detalle.slice(enviadosDetalle),
      };
      const cuerpo = JSON.stringify(carga);
      // sendBeacon sobrevive al cierre de la pestaña; fetch con keepalive es el respaldo.
      const ok = navigator.sendBeacon?.(URL_API, new Blob([cuerpo], { type: 'text/plain' }));
      if (!ok) {
        fetch(URL_API, { method: 'POST', body: cuerpo, keepalive: true }).catch(() => {});
      }
      enviadosDetalle = detalle.length;
    };

    if (puedeCorrer()) corriendoDesde = Date.now();
    // Una primera señal enseguida: la vista cuenta aunque se vayan en el primer segundo.
    enviar();

    const alActividad = () => {
      ultimaActividad = Date.now();
      reanudar();
    };
    const alClick = (e: MouseEvent) => {
      alActividad();
      if (!contar_clicks) return;
      const n = clicks++;
      if (n < clicks_max_por_vista) detalle.push({ n, e: describir(e.target) });
    };
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === 'hidden') {
        if (solo_pestana_visible) pausar();
        enviar();
      } else {
        ultimaActividad = Date.now();
        reanudar();
      }
    };

    const eventosActividad = ['pointermove', 'keydown', 'scroll', 'touchstart', 'wheel'] as const;
    eventosActividad.forEach(ev => window.addEventListener(ev, alActividad, { passive: true }));
    document.addEventListener('click', alClick, { capture: true });
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    window.addEventListener('pagehide', enviar);

    // Revisa la inactividad cada 5 s y manda el heartbeat si hubo algo nuevo.
    let ultimoEnvio = Date.now();
    let msEnviados = 0;
    let clicksEnviados = 0;
    const reloj = window.setInterval(() => {
      if (inactividad_seg > 0 && corriendoDesde !== null && Date.now() - ultimaActividad > inactividad_seg * 1000) {
        pausar(ultimaActividad + inactividad_seg * 1000);
      }
      if (Date.now() - ultimoEnvio >= heartbeat_seg * 1000) {
        const ms = msActuales();
        if (ms !== msEnviados || clicks !== clicksEnviados) {
          enviar();
          msEnviados = ms;
          clicksEnviados = clicks;
        }
        ultimoEnvio = Date.now();
      }
    }, 5000);

    return () => {
      window.clearInterval(reloj);
      eventosActividad.forEach(ev => window.removeEventListener(ev, alActividad));
      document.removeEventListener('click', alClick, { capture: true });
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      window.removeEventListener('pagehide', enviar);
      pausar();
      enviar();
    };
  }, [pathname, config, idioma]);

  return null;
}

/** ¿Ya se midió una pantalla en esta sesión? Lo marca para las que vengan. */
function yaHuboPantalla(): boolean {
  try {
    const yaHubo = window.sessionStorage.getItem('fest-p') === '1';
    window.sessionStorage.setItem('fest-p', '1');
    return yaHubo;
  } catch {
    return true;
  }
}
