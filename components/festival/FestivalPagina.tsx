'use client';

import { useMemo, useState } from 'react';
import {
  FestivalConfig,
  FestivalEntrada,
  FestivalEscenario,
  etiquetaEstado,
} from '@/lib/types/festival';
import { formatArs } from '@/lib/precios';
import { SemillaDeLaVida } from './SemillaDeLaVida';
import { FotoAnalogica } from './FotoAnalogica';

interface Props {
  config: FestivalConfig;
  escenarios: FestivalEscenario[];
  entradas: FestivalEntrada[];
  /** Sin publicar: quien la está viendo es un admin. */
  borrador: boolean;
}

/** `2026-12-11` → `11.12.2026`, sin pasar por Date para no correr el día por zona horaria. */
const fechaCorta = (iso: string | null) => {
  if (!iso) return null;
  const [a, m, d] = iso.split('-');
  return a && m && d ? `${d}.${m}.${a}` : null;
};

/** Corrimiento de cada línea del line-up, en %: texto suelto, no en bloque. */
const CORRIMIENTOS = [0, 38, 12, 56, 24, 4, 46, 18, 62, 30];

/**
 * Página del festival. Identidad tomada de las láminas de Ana (raves en el
 * bosque, humo, foto analógica, degradés, tipografía fina + mono); la venta
 * sigue el modelo de Passline: una tabla de tipos de entrada con estado.
 *
 * Los tres colores base vienen del panel como variables CSS. La compra
 * todavía no está conectada.
 */
export function FestivalPagina({ config, escenarios, entradas, borrador }: Props) {
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [avisoCompra, setAvisoCompra] = useState(false);

  const { total, unidades } = useMemo(
    () =>
      entradas.reduce(
        (acc, e) => {
          const n = cantidades[e.id] ?? 0;
          return {
            total: acc.total + n * e.precio,
            unidades: acc.unidades + n * e.entradas_por_unidad,
          };
        },
        { total: 0, unidades: 0 }
      ),
    [entradas, cantidades]
  );

  const fecha = fechaCorta(config.fecha);
  const lineup = escenarios
    .map(e => ({ ...e, artistas: e.artistas.filter(Boolean) }))
    .filter(e => e.artistas.length > 0);

  const estilo = {
    '--fest-fondo': config.color_fondo,
    '--fest-texto': config.color_texto,
    '--fest-acento': config.color_acento,
  } as React.CSSProperties;

  const MONO = 'font-[family-name:var(--font-fest-mono)]';
  const DISPLAY = 'font-[family-name:var(--font-fest-display)]';
  const ROTULO = `${MONO} text-[10px] sm:text-[11px] uppercase tracking-[0.3em] opacity-70`;

  return (
    <div
      style={estilo}
      className={`${MONO} min-h-screen bg-[var(--fest-fondo)] text-[var(--fest-texto)] selection:bg-[var(--fest-acento)] selection:text-black`}
    >
      {borrador && (
        <div className="fixed top-0 inset-x-0 z-50 bg-black/70 backdrop-blur text-center text-[10px] uppercase tracking-[0.3em] py-2 px-4">
          Borrador — sin publicar, solo lo ven los admins
        </div>
      )}

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <header className="relative h-[100svh] min-h-[560px] max-h-[1100px] flex flex-col overflow-hidden">
        {/* Banner del panel. Oscurecido para que el título se lea sobre cualquier foto. */}
        <div aria-hidden className="absolute inset-0">
          {config.banner_url && (
            <>
              <img
                loading="lazy"
                decoding="async"
                src={config.banner_url}
                alt=""
                fetchPriority="high"
                className="absolute inset-0 w-full h-full object-cover [filter:sepia(0.12)_saturate(0.9)_contrast(0.95)]"
              />
              <div className="absolute inset-0 bg-black/35" />
            </>
          )}
          {/* Se funde con la página abajo, y el grano le quita lo digital. */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[var(--fest-fondo)] to-transparent" />
          <div className="fest-grano" />
        </div>

        <div className="relative z-10 flex justify-between gap-4 px-5 sm:px-10 pt-12 sm:pt-14 text-[10px] sm:text-xs uppercase tracking-[0.3em]">
          <span>Manso presenta</span>
          {fecha && <span className="tabular-nums">{fecha}</span>}
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-5 sm:px-10 py-16">
          <h1
            className={`${DISPLAY} fest-titulo font-light lowercase leading-[0.85] tracking-[-0.02em] text-[clamp(4rem,15vw,13rem)] break-words`}
          >
            {config.nombre}
          </h1>

          <div className="mt-8 sm:mt-10 flex flex-wrap gap-x-8 gap-y-2 text-xs sm:text-sm uppercase tracking-[0.25em]">
            {config.lugar && <span>{config.lugar}</span>}
            {config.direccion && <span className="opacity-70">{config.direccion}</span>}
            {config.horario && <span className="opacity-70">{config.horario}</span>}
          </div>
        </div>

        <div className="relative z-10 px-5 sm:px-10 pb-8 flex items-end justify-between gap-6">
          {config.bajada ? (
            <p className="max-w-sm text-xs sm:text-sm leading-relaxed opacity-80 whitespace-pre-line">
              {config.bajada}
            </p>
          ) : (
            <span />
          )}
          <a
            href="#entradas"
            className="shrink-0 text-[10px] sm:text-xs uppercase tracking-[0.3em] border-b border-current pb-1 hover:text-[var(--fest-acento)] transition-colors"
          >
            Entradas ↓
          </a>
        </div>
      </header>

      <main className="px-5 sm:px-10">
        {/* ── Line-up ──────────────────────────────────────────────── */}
        {lineup.length > 0 && (
          <section className="max-w-6xl mx-auto py-24 sm:py-36 space-y-20">
            <p className={ROTULO}>01 — Line-up</p>

            {lineup.map((esc, e) => (
              <div key={esc.id} className="space-y-6">
                <p className={`${ROTULO} flex items-center gap-3`}>
                  <span className="inline-block w-8 h-px bg-current" />
                  {esc.nombre}
                </p>
                <ul className="space-y-2 sm:space-y-3">
                  {esc.artistas.map((artista, i) => {
                    const off = CORRIMIENTOS[(i + e * 3) % CORRIMIENTOS.length];
                    return (
                      <li
                        key={`${artista}-${i}`}
                        style={{ '--off': off } as React.CSSProperties}
                        className={`${DISPLAY} font-light leading-tight text-[clamp(1.8rem,5vw,4rem)] pl-[calc(var(--off)*0.45%)] md:pl-[calc(var(--off)*1%)]`}
                      >
                        {/* Los B2B se leen como una unidad: el "b2b" va en mono chica. */}
                        {artista.split(/\s+(b2b)\s+/i).map((parte, k) =>
                          /^b2b$/i.test(parte) ? (
                            <span key={k} className={`${MONO} text-[0.35em] align-middle mx-3 opacity-60 uppercase tracking-[0.2em]`}>
                              b2b
                            </span>
                          ) : (
                            <span key={k} className="whitespace-nowrap">{parte}</span>
                          )
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </section>
        )}

        {/* ── Foto del panel, tratada como analógica ───────────────── */}
        {config.foto_url && (
          <FotoAnalogica
            src={config.foto_url}
            alt=""
            pie={[config.lugar, fecha].filter(Boolean).join(' — ')}
          />
        )}

        {/* ── Entradas ─────────────────────────────────────────────── */}
        <section id="entradas" className="max-w-4xl mx-auto py-24 sm:py-32 space-y-10 scroll-mt-10">
          <p className={ROTULO}>{lineup.length > 0 ? '02' : '01'} — Entradas</p>

          {entradas.length === 0 ? (
            <p className="text-sm opacity-60">Las entradas se anuncian pronto.</p>
          ) : (
            <div>
              <div className="hidden sm:grid grid-cols-[1fr_9rem_8rem] gap-4 pb-3 border-b border-[var(--fest-texto)]/30 text-[10px] uppercase tracking-[0.3em] opacity-60">
                <span>Tipo de ticket</span>
                <span>Valor</span>
                <span className="text-right">Cantidad</span>
              </div>

              <ul>
                {entradas.map(entrada => {
                  const enVenta = entrada.estado === 'en_venta';
                  const cerrada = entrada.estado === 'agotado' || entrada.estado === 'finalizado';
                  const precio = entrada.precio > 0 ? formatArs(entrada.precio) : '—';
                  return (
                    <li
                      key={entrada.id}
                      className={`grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_9rem_8rem] items-center gap-x-4 gap-y-1 py-5 border-b border-[var(--fest-texto)]/15 ${
                        cerrada ? 'opacity-35' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <p className={`text-sm uppercase tracking-[0.12em] ${cerrada ? 'line-through' : ''}`}>
                          {entrada.nombre}
                        </p>
                        {(entrada.descripcion || entrada.entradas_por_unidad > 1) && (
                          <p className="text-[11px] opacity-60 mt-1">
                            {entrada.descripcion || `Incluye ${entrada.entradas_por_unidad} entradas`}
                          </p>
                        )}
                        <p className="sm:hidden text-sm tabular-nums mt-1 opacity-90">{precio}</p>
                      </div>

                      <p className="hidden sm:block text-sm tabular-nums">{precio}</p>

                      <div className="justify-self-end">
                        {enVenta ? (
                          <select
                            aria-label={`Cantidad de ${entrada.nombre}`}
                            value={cantidades[entrada.id] ?? 0}
                            onChange={e =>
                              setCantidades(prev => ({ ...prev, [entrada.id]: Number(e.target.value) }))
                            }
                            className="w-24 bg-transparent border border-[var(--fest-texto)]/40 rounded-full px-4 py-2 text-sm tabular-nums focus:outline-none focus:border-[var(--fest-acento)]"
                          >
                            {Array.from({ length: entrada.max_por_compra + 1 }, (_, n) => (
                              <option key={n} value={n} className="text-black">
                                {n}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-block w-24 text-center rounded-full border border-[var(--fest-texto)]/30 px-2 py-2 text-[10px] uppercase tracking-[0.2em]">
                            {etiquetaEstado(entrada.estado)}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 sm:gap-8 pt-10">
                {total > 0 && (
                  <p className="text-xs uppercase tracking-[0.25em]">
                    {unidades} {unidades === 1 ? 'entrada' : 'entradas'} ·{' '}
                    <span className="tabular-nums">{formatArs(total)}</span>
                  </p>
                )}
                <button
                  type="button"
                  disabled={total === 0}
                  onClick={() => setAvisoCompra(true)}
                  className="rounded-full px-12 py-4 text-xs uppercase tracking-[0.35em] bg-[var(--fest-texto)] text-[var(--fest-fondo)] shadow-[0_0_40px_-10px_rgb(255_255_255/0.35)] transition-[opacity,transform] enabled:hover:-translate-y-0.5 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Comprar
                </button>
              </div>

              {avisoCompra && (
                <p role="status" className="sm:text-right text-[11px] uppercase tracking-[0.25em] mt-4 opacity-70">
                  La venta online abre pronto.
                </p>
              )}
            </div>
          )}

          {config.aviso && (
            <p className="text-center text-[11px] uppercase tracking-[0.3em] pt-8 opacity-80">
              {config.aviso}
            </p>
          )}
        </section>
      </main>

      {/* ── Cierre: la semilla de la vida quieta, como sello ────────── */}
      <footer className="relative overflow-hidden border-t border-[var(--fest-texto)]/15">
        <div className="relative px-5 sm:px-10 py-16 sm:py-20 grid gap-10 sm:grid-cols-[1fr_auto_1fr] items-center text-[10px] sm:text-xs uppercase tracking-[0.3em]">
          <span className="sm:justify-self-start">{config.lema || config.nombre}</span>
          <SemillaDeLaVida className="w-20 h-20 sm:w-24 sm:h-24 justify-self-center opacity-70" />
          <span className="sm:justify-self-end opacity-70">Manso Club — {fecha ?? 'Diciembre'}</span>
        </div>
        <div aria-hidden className="fest-grano" />
      </footer>
    </div>
  );
}
