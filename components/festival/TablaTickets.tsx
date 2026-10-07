'use client';

import { FormEvent, useMemo, useState } from 'react';
import { FestivalEntrada, MEDIOS_PAGO, MedioPago, etiquetaEstado } from '@/lib/types/festival';
import { formatArs } from '@/lib/precios';

/**
 * Tabla de venta (modelo Passline): una fila por tipo de entrada. Solo las que
 * están en venta tienen contador; el resto muestra su estado.
 *
 * COMPRAR pide nombre, mail y medio de pago (los que estén prendidos y
 * configurados, ver `mediosDePago`); `/api/festival/compra` arma la orden y
 * devuelve a dónde ir: el checkout de Mercado Pago, o `/festival/compra/[id]`
 * con los datos de la transferencia o la elección de red en cripto. Sin
 * ningún medio disponible, la tabla se ve pero no se puede comprar.
 */
export function TablaTickets({
  entradas,
  aviso,
  medios,
}: {
  entradas: FestivalEntrada[];
  aviso: string | null;
  medios: MedioPago[];
}) {
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [datosAbiertos, setDatosAbiertos] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [metodo, setMetodo] = useState<MedioPago | undefined>(medios[0]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { total, unidades } = useMemo(
    () =>
      entradas.reduce(
        (acc, e) => {
          const n = cantidades[e.id] ?? 0;
          return { total: acc.total + n * e.precio, unidades: acc.unidades + n * e.entradas_por_unidad };
        },
        { total: 0, unidades: 0 }
      ),
    [entradas, cantidades]
  );

  const cambiar = (entrada: FestivalEntrada, delta: number) =>
    setCantidades(prev => {
      const n = Math.min(entrada.max_por_compra, Math.max(0, (prev[entrada.id] ?? 0) + delta));
      return { ...prev, [entrada.id]: n };
    });

  const comprar = async (ev: FormEvent) => {
    ev.preventDefault();
    const seleccion = Object.entries(cantidades)
      .filter(([, cantidad]) => cantidad > 0)
      .map(([id, cantidad]) => ({ id, cantidad }));
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch('/api/festival/compra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          email,
          metodo,
          items: seleccion,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error ?? 'No pudimos iniciar la compra.');
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos iniciar la compra.');
      setEnviando(false);
    }
  };

  if (entradas.length === 0) {
    return <p className="text-sm opacity-60">Las entradas se anuncian pronto.</p>;
  }

  return (
    <div className="max-w-[980px]">
      <div className="hidden sm:grid grid-cols-[1fr_160px_130px] gap-4 pb-3 border-b border-[var(--fest-texto)]/35 fest-mono text-[10px] uppercase tracking-[0.3em] opacity-60">
        <span>Tipo de ticket</span>
        <span>Valor</span>
        <span className="justify-self-end">Cantidad</span>
      </div>

      <ul>
        {entradas.map(entrada => {
          const enVenta = entrada.estado === 'en_venta';
          const cerrada = entrada.estado === 'agotado' || entrada.estado === 'finalizado';
          const n = cantidades[entrada.id] ?? 0;
          return (
            <li
              key={entrada.id}
              className={`grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_160px_130px] items-center gap-x-4 gap-y-1.5 py-5 border-b border-[var(--fest-texto)]/15 ${
                cerrada ? 'opacity-35' : ''
              }`}
            >
              <div className="min-w-0">
                <h3 className={`fest-angosta text-2xl leading-none ${cerrada ? 'line-through' : ''}`}>
                  {entrada.nombre}
                </h3>
                {(entrada.descripcion || entrada.entradas_por_unidad > 1) && (
                  <p className="text-[13px] opacity-55 mt-1.5">
                    {entrada.descripcion || `Incluye ${entrada.entradas_por_unidad} entradas`}
                  </p>
                )}
              </div>

              <p className="fest-mono text-base row-start-2 sm:row-start-auto">
                {entrada.precio > 0 ? formatArs(entrada.precio) : '—'}
              </p>

              <div className="justify-self-end row-span-2 sm:row-span-1 col-start-2 sm:col-start-auto row-start-1 sm:row-start-auto">
                {enVenta ? (
                  <div className="flex border border-[var(--fest-texto)]/40">
                    <button
                      type="button"
                      onClick={() => cambiar(entrada, -1)}
                      disabled={n === 0}
                      aria-label={`Una ${entrada.nombre} menos`}
                      className="w-9 h-[38px] text-lg enabled:hover:text-[var(--fest-acento)] disabled:opacity-30"
                    >
                      −
                    </button>
                    <span
                      aria-live="polite"
                      className="w-11 grid place-items-center fest-mono border-x border-[var(--fest-texto)]/15 tabular-nums"
                    >
                      {n}
                    </span>
                    <button
                      type="button"
                      onClick={() => cambiar(entrada, 1)}
                      disabled={n >= entrada.max_por_compra}
                      aria-label={`Una ${entrada.nombre} más`}
                      className="w-9 h-[38px] text-lg enabled:hover:text-[var(--fest-acento)] disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <span className="inline-block w-[120px] text-center border border-[var(--fest-texto)]/15 px-2.5 py-2 fest-mono text-[10px] uppercase tracking-[0.2em]">
                    {etiquetaEstado(entrada.estado)}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3.5 sm:gap-8 mt-9">
        {total > 0 && (
          <p className="fest-mono text-[13px] uppercase tracking-[0.15em]">
            {unidades} {unidades === 1 ? 'entrada' : 'entradas'} · <span className="tabular-nums">{formatArs(total)}</span>
          </p>
        )}
        <button
          type="button"
          disabled={total === 0 || !metodo}
          onClick={() => setDatosAbiertos(true)}
          className="fest-angosta text-2xl px-10 py-3 bg-[var(--fest-acento)] text-[var(--fest-fondo)] enabled:hover:bg-[var(--fest-texto)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Comprar
        </button>
      </div>

      {!metodo && (
        <p className="mt-4 sm:text-right fest-mono text-[11px] uppercase tracking-[0.2em] opacity-60">
          La venta online abre pronto.
        </p>
      )}

      {datosAbiertos && total > 0 && metodo && (
        <form onSubmit={comprar} className="mt-8 sm:ml-auto sm:max-w-[420px] grid gap-3">
          {medios.length > 1 && (
            <fieldset className="grid gap-2 mb-2">
              <legend className="fest-mono text-[10px] uppercase tracking-[0.3em] opacity-60 mb-2">Medio de pago</legend>
              {medios.map(m => (
                <label
                  key={m}
                  className={`flex items-center gap-3 border px-3 py-2.5 cursor-pointer transition-colors ${
                    m === metodo ? 'border-[var(--fest-acento)]' : 'border-[var(--fest-texto)]/25 hover:border-[var(--fest-texto)]/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="metodo"
                    value={m}
                    checked={m === metodo}
                    onChange={() => setMetodo(m)}
                    className="accent-[var(--fest-acento)]"
                  />
                  <span className="fest-angosta text-xl leading-none">{MEDIOS_PAGO[m].nombre}</span>
                </label>
              ))}
            </fieldset>
          )}
          <p className="fest-mono text-[11px] uppercase tracking-[0.2em] opacity-70 leading-relaxed">
            {MEDIOS_PAGO[metodo].detalle}
          </p>
          <input
            required
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Nombre y apellido"
            autoComplete="name"
            maxLength={120}
            className="bg-transparent border border-[var(--fest-texto)]/40 px-3 py-2.5 text-[15px] placeholder:opacity-50 focus:outline-none focus:border-[var(--fest-acento)]"
          />
          <input
            required
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Mail"
            autoComplete="email"
            className="bg-transparent border border-[var(--fest-texto)]/40 px-3 py-2.5 text-[15px] placeholder:opacity-50 focus:outline-none focus:border-[var(--fest-acento)]"
          />
          <button
            type="submit"
            disabled={enviando}
            className="fest-angosta text-2xl py-3 bg-[var(--fest-acento)] text-[var(--fest-fondo)] enabled:hover:bg-[var(--fest-texto)] transition-colors disabled:opacity-50"
          >
            {enviando ? 'Preparando…' : MEDIOS_PAGO[metodo].boton}
          </button>
          {error && (
            <p role="alert" className="fest-mono text-[11px] uppercase tracking-[0.2em] text-[var(--fest-acento)]">
              {error}
            </p>
          )}
        </form>
      )}

      {aviso && (
        <p className="mt-12 fest-mono text-[11px] uppercase tracking-[0.3em] text-[var(--fest-resalte)]">{aviso}</p>
      )}
    </div>
  );
}
