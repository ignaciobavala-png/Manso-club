'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, MessageCircle, X } from 'lucide-react';
import Image from 'next/image';
import { useIdioma } from '@/components/festival/Idioma';
import { RECURSOS } from '@/components/festival/SeccionMarca';
import { TEXTOS } from '@/lib/festival-idioma';

/**
 * El chat de /blurfestival: una burbuja fija a la derecha que abre un panel
 * donde el público pregunta por el festival (cómo llegar, horarios, entradas).
 * Lo responde `/api/festival/bot`.
 *
 * La respuesta llega entera y acá se muestra "escribiéndose" letra por letra
 * (`Escrito`): es un efecto, no streaming. Así el servidor queda simple y la
 * charla se siente viva igual.
 *
 * En el celular la burbuja va ARRIBA del botón TICKETS fijo del menú (que
 * ocupa `right-4 bottom-4`): no se pisan. El panel abierto la reemplaza.
 */

interface Mensaje {
  role: 'user' | 'assistant';
  content: string;
}

type CodigoError = 'limite' | 'no-disponible' | 'invalido';

const CLAVE = 'fest-bot';
/** Igual que el tope del servidor (`LIMITES_BOT.largoPregunta`). */
const LARGO_MAX = 400;

/** Un pedazo de respuesta: texto suelto o un link. */
interface Trozo {
  texto: string;
  href?: string;
}

const DOMINIO_PROPIO = /^(www\.)?mansoclub\.com\.ar$/;

/** Un link al propio sitio se navega relativo: anda igual en local y en un preview. */
function enlace(url: string): Trozo {
  try {
    const u = new URL(url);
    const propio = DOMINIO_PROPIO.test(u.hostname);
    return {
      texto: `${u.hostname.replace(/^www\./, '')}${u.pathname === '/' ? '' : u.pathname}`,
      href: propio ? `${u.pathname}${u.search}${u.hash}` : url,
    };
  } catch {
    return { texto: url };
  }
}

/**
 * Parte la respuesta en texto y links. Al modelo se le pide texto plano con
 * URLs sueltas, pero si igual manda Markdown (`**negrita**`, `[texto](url)`,
 * `# título`) se limpia acá para que nunca se vean los símbolos.
 */
function trozos(texto: string): Trozo[] {
  const limpio = texto
    .replace(/\*\*|__/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '$2');
  const salida: Trozo[] = [];
  let desde = 0;
  for (const m of limpio.matchAll(/https?:\/\/[^\s<>()[\]]+/g)) {
    // La puntuación pegada al final es de la oración, no del link.
    const url = m[0].replace(/[.,;:!?]+$/, '');
    const inicio = m.index ?? 0;
    if (inicio > desde) salida.push({ texto: limpio.slice(desde, inicio) });
    salida.push(enlace(url));
    desde = inicio + url.length;
  }
  if (desde < limpio.length) salida.push({ texto: limpio.slice(desde) });
  return salida;
}

/**
 * Una respuesta del bot. Con `animar`, se escribe sola: avanza por tiempo (no
 * por cuadro, así no depende de la pantalla) y un texto largo acelera para no
 * tardar más de `MAXIMO`. Con "reducir movimiento" aparece de una.
 */
function Escrito({ texto, animar, alAvanzar }: { texto: string; animar: boolean; alAvanzar: () => void }) {
  const partes = trozos(texto);
  const total = partes.reduce((n, t) => n + t.texto.length, 0);
  const [letras, setLetras] = useState(animar ? 0 : total);

  useEffect(() => {
    if (!animar) return;
    const deUna = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const RITMO = 14;
    const MAXIMO = 3500;
    const porLetra = Math.min(RITMO, MAXIMO / Math.max(total, 1));
    const inicio = performance.now();
    let cuadro = 0;
    const paso = (ahora: number) => {
      const n = deUna ? total : Math.min(total, Math.floor((ahora - inicio) / porLetra));
      setLetras(n);
      if (n < total) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [animar, total]);

  // El panel acompaña el texto mientras crece.
  useEffect(() => {
    alAvanzar();
  }, [letras, alAvanzar]);

  // Cuántas letras ya escritas le tocan a cada trozo.
  const visibles = partes.reduce<number[]>((acc, t) => {
    const usadas = acc.reduce((a, b) => a + b, 0);
    return [...acc, Math.max(0, Math.min(t.texto.length, letras - usadas))];
  }, []);

  return (
    <p className="whitespace-pre-wrap break-words">
      {/* El texto entero para lectores de pantalla; lo animado es decorativo. */}
      <span className="sr-only">{partes.map(t => t.texto).join('')}</span>
      <span aria-hidden>
        {partes.map((t, i) => {
          const n = visibles[i];
          if (n === 0) return null;
          const visible = t.texto.slice(0, n);
          return t.href ? (
            <a
              key={i}
              href={t.href}
              tabIndex={n < t.texto.length ? -1 : 0}
              className="underline underline-offset-2 text-[var(--fest-acento)] hover:text-[var(--fest-texto)] transition-colors"
              {...(t.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {visible}
            </a>
          ) : (
            <span key={i}>{visible}</span>
          );
        })}
        {letras < total && <span className="fest-cursor" />}
      </span>
    </p>
  );
}

export function BotBlur() {
  const t = TEXTOS[useIdioma()].bot;
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [esperando, setEsperando] = useState(false);
  const [error, setError] = useState<CodigoError | null>(null);
  /** Índice de la respuesta recién llegada: la única que se escribe sola. */
  const [recien, setRecien] = useState<number | null>(null);
  const sesion = useRef<string | null>(null);
  const lista = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const burbuja = useRef<HTMLButtonElement>(null);

  // La charla sobrevive a cambiar de página dentro del festival (el pie y
  // algunos links recargan), pero no a cerrar la pestaña.
  useEffect(() => {
    try {
      const guardado = JSON.parse(sessionStorage.getItem(CLAVE) ?? 'null') as { sesion?: string; mensajes?: Mensaje[] } | null;
      if (guardado?.sesion) sesion.current = guardado.sesion;
      if (Array.isArray(guardado?.mensajes)) setMensajes(guardado.mensajes);
    } catch {
      /* sin storage (modo privado): la charla vive solo en memoria */
    }
    if (!sesion.current) {
      try {
        sesion.current = crypto.randomUUID();
      } catch {
        /* navegador viejo: la bitácora queda sin agrupar */
      }
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify({ sesion: sesion.current, mensajes }));
    } catch {
      /* ídem */
    }
  }, [mensajes]);

  const alFondo = useCallback(() => {
    const el = lista.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(alFondo, [mensajes, esperando, error, abierto, alFondo]);

  /** Cierra y devuelve el foco a la burbuja, que vuelve a aparecer. */
  const cerrar = useCallback(() => {
    setAbierto(false);
    requestAnimationFrame(() => burbuja.current?.focus());
  }, []);

  useEffect(() => {
    if (!abierto) return;
    // En el celular el foco abre el teclado y tapa las sugerencias: solo en escritorio.
    if (window.matchMedia('(min-width: 640px)').matches) campo.current?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar();
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [abierto, cerrar]);

  async function enviar(pregunta: string) {
    const limpia = pregunta.trim().slice(0, LARGO_MAX);
    if (!limpia || esperando) return;
    const charla: Mensaje[] = [...mensajes, { role: 'user', content: limpia }];
    setMensajes(charla);
    setTexto('');
    setError(null);
    setEsperando(true);
    try {
      const res = await fetch('/api/festival/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sesion: sesion.current ?? undefined, mensajes: charla }),
      });
      const datos = (await res.json().catch(() => null)) as { respuesta?: string; error?: CodigoError } | null;
      if (!res.ok || !datos?.respuesta) {
        // La pregunta vuelve al campo: no queda una pregunta sin respuesta en la charla.
        setMensajes(mensajes);
        setTexto(limpia);
        setError(datos?.error && datos.error in t.errores ? datos.error : 'no-disponible');
        return;
      }
      setRecien(charla.length);
      setMensajes([...charla, { role: 'assistant', content: datos.respuesta }]);
    } catch {
      setMensajes(mensajes);
      setTexto(limpia);
      setError('no-disponible');
    } finally {
      setEsperando(false);
    }
  }

  return (
    <>
      {/* Con el panel abierto la burbuja se esconde: el panel trae su X.
          Verde con aro crema y no un color de la paleta: las secciones cambian
          de fondo (verde, gris, naranja, crema, rosa) y así contrasta en todas.
          En escritorio va despegada del borde de abajo para no tapar la franja
          de fecha del home ni el pie. */}
      <button
        ref={burbuja}
        type="button"
        onClick={() => setAbierto(true)}
        aria-label={t.abrir}
        aria-expanded={abierto}
        aria-controls="fest-bot-panel"
        className={`fest-bot-late fixed right-4 bottom-[4.5rem] sm:right-5 sm:bottom-24 z-30 size-14 rounded-full place-items-center bg-[#003009] text-[#FFFCDC] border-2 border-[#FFFCDC] shadow-[0_2px_14px_rgba(0,0,0,0.45)] hover:bg-[#F65200] hover:text-[#003009] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F65200] ${
          abierto ? 'hidden' : 'grid'
        }`}
      >
        <MessageCircle className="size-6" aria-hidden />
      </button>

      {abierto && (
        <div
          id="fest-bot-panel"
          role="dialog"
          aria-label={t.titulo}
          // Colores fijos: el hover del line-up cambia las --fest-* de la página y no deben tocar el chat.
          style={
            {
              '--fest-fondo': '#2F3A1E',
              '--fest-texto': '#FFFCDC',
              '--fest-acento': '#F65200',
              '--fest-resalte': '#FFA7FE',
            } as React.CSSProperties
          }
          className="fest-bot-entra fixed z-40 inset-x-0 bottom-0 h-[85dvh] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[380px] sm:h-[560px] sm:max-h-[calc(100dvh-2.5rem)] overflow-hidden flex flex-col bg-[#2F3A1E] text-[var(--fest-texto)] border border-[var(--fest-texto)]/25 shadow-[0_8px_40px_rgba(0,0,0,0.55)]"
        >
          {/* Dibujo de fondo: la textura y una nota de la marca, bajas de opacidad y sin tocar el texto. */}
          <Image
            aria-hidden
            src={RECURSOS.texturaBlanca.src}
            alt=""
            width={RECURSOS.texturaBlanca.w}
            height={RECURSOS.texturaBlanca.h}
            unoptimized
            sizes="300px"
            className="fest-brisa absolute -left-[12%] -bottom-[4%] w-[78%] h-auto opacity-[0.12] pointer-events-none select-none"
          />
          <Image
            aria-hidden
            src={RECURSOS.notas.src}
            alt=""
            width={RECURSOS.notas.w}
            height={RECURSOS.notas.h}
            sizes="120px"
            className="fest-flota absolute right-[5%] top-[7%] w-[15%] h-auto opacity-[0.22] pointer-events-none select-none"
          />

          <header className="relative z-10 flex items-center justify-between gap-4 px-4 py-3 border-b border-[var(--fest-texto)]/20">
            <h2 className="fest-menu text-[17px] leading-none text-[var(--fest-acento)]">{t.titulo}</h2>
            <button
              type="button"
              onClick={cerrar}
              aria-label={t.cerrar}
              className="-mr-1.5 p-1.5 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="size-5" aria-hidden />
            </button>
          </header>

          <div ref={lista} aria-live="polite" className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-4 py-4 flex flex-col gap-3.5 text-[15px] leading-[1.45]">
            {mensajes.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {t.sugerencias.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => enviar(s)}
                    disabled={esperando}
                    className="fest-mono text-[12px] px-2.5 py-1.5 border border-[var(--fest-texto)]/35 hover:border-[var(--fest-acento)] hover:text-[var(--fest-acento)] transition-colors disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {mensajes.map((m, i) =>
              m.role === 'user' ? (
                <p key={i} className="self-end max-w-[85%] px-3 py-2 bg-[var(--fest-acento)] text-[var(--fest-fondo)] whitespace-pre-wrap break-words">
                  {m.content}
                </p>
              ) : (
                <div key={i} className="max-w-[88%]">
                  <Escrito texto={m.content} animar={i === recien} alAvanzar={alFondo} />
                </div>
              )
            )}

            {esperando && (
              <p className="flex items-center gap-1 h-[1.45em]" role="status">
                <span className="sr-only">{t.escribiendo}</span>
                <span aria-hidden className="fest-bot-punto" />
                <span aria-hidden className="fest-bot-punto" />
                <span aria-hidden className="fest-bot-punto" />
              </p>
            )}

            {error && (
              <p role="alert" className="fest-mono text-[12px] leading-[1.5] text-[var(--fest-resalte)]">
                {t.errores[error]}
              </p>
            )}
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              enviar(texto);
            }}
            className="relative z-10 border-t border-[var(--fest-texto)]/20"
          >
            <div className="flex items-center gap-2 px-3 py-2.5">
              <input
                ref={campo}
                value={texto}
                onChange={e => setTexto(e.target.value)}
                maxLength={LARGO_MAX}
                placeholder={t.placeholder}
                aria-label={t.placeholder}
                enterKeyHint="send"
                autoComplete="off"
                // 16px: con menos, iOS hace zoom al enfocar.
                className="flex-1 min-w-0 bg-transparent text-[16px] placeholder:text-[var(--fest-texto)]/45 outline-none py-1.5"
              />
              <button
                type="submit"
                disabled={esperando || !texto.trim()}
                aria-label={t.enviar}
                className="shrink-0 size-9 grid place-items-center bg-[var(--fest-acento)] text-[var(--fest-fondo)] hover:bg-[var(--fest-texto)] transition-colors disabled:opacity-35 disabled:hover:bg-[var(--fest-acento)]"
              >
                <ArrowUp className="size-5" aria-hidden />
              </button>
            </div>
            <p className="fest-mono text-[10px] leading-[1.4] opacity-50 px-3 pb-2.5">{t.aviso}</p>
          </form>
        </div>
      )}
    </>
  );
}
