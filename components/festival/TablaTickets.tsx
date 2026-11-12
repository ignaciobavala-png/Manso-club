'use client';

import { FormEvent, useMemo, useState } from 'react';
import { FestivalEntrada, MedioPago } from '@/lib/types/festival';
import { useTextos } from './Idioma';
import { formatArs } from '@/lib/precios';

/**
 * Tabla de venta (modelo Passline): una fila por tipo de entrada. Solo las que
 * están en venta tienen contador; el resto muestra su estado.
 *
 * COMPRAR pide nombre, mail y medio de pago (los que estén prendidos y
 * configurados, ver `mediosDePago`); `/api/festival/compra` arma la orden y
 * devuelve a dónde ir: el checkout de Mercado Pago, o `/blurfestival/compra/[id]`
 * con los datos de la transferencia o la elección de red en cripto. Sin
 * ningún medio disponible, la tabla se ve pero no se puede comprar.
 */
export function TablaTickets({
  entradas,
  aviso,
  medios,
  cotizacion = null,
  urlTransferencia = null,
}: {
  entradas: FestivalEntrada[];
  aviso: string | null;
  medios: MedioPago[];
  /** Dólar blue, solo para mostrar el equivalente aproximado en USDT: el cobro lo resuelve el servidor. */
  cotizacion?: number | null;
  /** Adónde va quien elige transferencia: la página de compra de Gestión. */
  urlTransferencia?: string | null;
}) {
  const t = useTextos();
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
    if (metodo === 'transferencia' && urlTransferencia) {
      window.location.href = urlTransferencia;
      return;
    }
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
      if (!res.ok || !data.url) throw new Error(data.error ?? t.tickets.errorCompra);
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : t.tickets.errorCompra);
      setEnviando(false);
    }
  };

  if (entradas.length === 0) {
    return <p className="text-sm opacity-60">{t.tickets.pronto}</p>;
  }

  return (
    <div className="max-w-[980px]">
      <div className="hidden sm:grid grid-cols-[1fr_160px_130px] gap-4 pb-3 border-b-[3px] border-[var(--fest-texto)] fest-mono text-[10px] uppercase tracking-[0.3em] [&>span]:opacity-70">
        <span>{t.tickets.tipo}</span>
        <span>{t.tickets.valor}</span>
        <span className="justify-self-end">{t.tickets.cantidad}</span>
      </div>

      <ul>
        {entradas.map(entrada => {
          const enVenta = entrada.estado === 'en_venta';
          const cerrada = entrada.estado === 'agotado' || entrada.estado === 'finalizado';
          const n = cantidades[entrada.id] ?? 0;
          return (
            <li
              key={entrada.id}
              className={`grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_160px_130px] items-center gap-x-4 gap-y-1.5 py-5 border-b-2 border-[var(--fest-texto)] ${
                cerrada ? 'opacity-35' : ''
              }`}
            >
              <div className="min-w-0">
                <h3 className={`fest-angosta text-2xl leading-none ${cerrada ? 'line-through' : ''}`}>
                  {entrada.nombre}
                  {entrada.entradas_por_unidad > 1 && (
                    <span className="inline-block align-middle ml-2.5 px-1.5 py-1 bg-[#FFA7FE] text-[#003009] fest-mono text-[11px] leading-none tracking-[0.1em]">
                      ×{entrada.entradas_por_unidad}
                    </span>
                  )}
                </h3>
                {entrada.descripcion && <p className="text-[13px] opacity-55 mt-1.5">{entrada.descripcion}</p>}
              </div>

              <p className="fest-mono text-base font-bold row-start-2 sm:row-start-auto">
                {entrada.precio > 0 ? formatArs(entrada.precio) : '—'}
              </p>

              <div className="justify-self-end row-span-2 sm:row-span-1 col-start-2 sm:col-start-auto row-start-1 sm:row-start-auto">
                {enVenta ? (
                  <div className="flex border-2 border-[var(--fest-texto)]">
                    <button
                      type="button"
                      onClick={() => cambiar(entrada, -1)}
                      disabled={n === 0}
                      aria-label={t.tickets.menos(entrada.nombre)}
                      className="w-9 h-[38px] text-lg enabled:hover:text-[var(--fest-acento)] disabled:opacity-30"
                    >
                      −
                    </button>
                    <span
                      aria-live="polite"
                      className="w-11 grid place-items-center fest-mono font-bold border-x-2 border-[var(--fest-texto)] tabular-nums"
                    >
                      {n}
                    </span>
                    <button
                      type="button"
                      onClick={() => cambiar(entrada, 1)}
                      disabled={n >= entrada.max_por_compra}
                      aria-label={t.tickets.mas(entrada.nombre)}
                      className="w-9 h-[38px] text-lg enabled:hover:text-[var(--fest-acento)] disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <span className="inline-block w-[120px] text-center border-2 border-[var(--fest-texto)]/60 px-2.5 py-2 fest-mono text-[10px] uppercase tracking-[0.2em]">
                    {t.estados[entrada.estado]}
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
            {unidades} {unidades === 1 ? t.tickets.entrada : t.tickets.entradas} · <span className="tabular-nums">{formatArs(total)}</span>
          </p>
        )}
        <button
          type="button"
          disabled={total === 0 || !metodo}
          onClick={() => setDatosAbiertos(true)}
          className="fest-menu text-[16px] sm:text-[18px] leading-[1.3] px-6 py-2.5 border-2 border-[var(--fest-acento)] bg-[var(--fest-acento)] text-[#1A1A1A] enabled:hover:bg-[var(--fest-texto)] enabled:hover:border-[var(--fest-texto)] enabled:hover:text-[var(--fest-fondo)] transition-colors disabled:bg-transparent disabled:border-[var(--fest-texto)]/35 disabled:text-[var(--fest-texto)]/45 disabled:cursor-not-allowed"
        >
          {t.tickets.comprar}
        </button>
      </div>

      {!metodo && (
        <p className="mt-4 sm:text-right fest-mono text-[11px] uppercase tracking-[0.2em] opacity-60">
          {t.tickets.ventaAbrePronto}
        </p>
      )}

      {datosAbiertos && total > 0 && metodo && (
        <form onSubmit={comprar} className="mt-8 sm:ml-auto sm:max-w-[420px] grid gap-3">
          {medios.length > 1 && (
            <fieldset className="grid gap-2 mb-2">
              <legend className="fest-mono text-[10px] uppercase tracking-[0.3em] opacity-60 mb-2">{t.tickets.medioDePago}</legend>
              {medios.map(m => (
                <label
                  key={m}
                  className={`flex items-center gap-3 border-2 px-3 py-2.5 cursor-pointer transition-colors ${
                    m === metodo ? 'border-[var(--fest-acento)]' : 'border-[var(--fest-texto)]/50 hover:border-[var(--fest-texto)]'
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
                  <span className="fest-angosta text-xl leading-none">{t.medios[m].nombre}</span>
                </label>
              ))}
            </fieldset>
          )}
          <p className="fest-mono text-[11px] uppercase tracking-[0.2em] opacity-70 leading-relaxed">
            {t.medios[metodo].detalle}
          </p>
          {metodo === 'cripto' && cotizacion && (
            <p className="fest-mono text-[12px] tracking-[0.1em] text-[var(--fest-resalte)] leading-relaxed">
              {t.tickets.equivale((total / cotizacion).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
            </p>
          )}
          {metodo !== 'transferencia' && (
            <>
          <input
            required
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder={t.tickets.nombre}
            autoComplete="name"
            maxLength={120}
            className="bg-transparent border-2 border-[var(--fest-texto)]/70 px-3 py-2.5 text-[15px] placeholder:opacity-50 focus:outline-none focus:border-[var(--fest-acento)]"
          />
          <input
            required
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t.tickets.mail}
            autoComplete="email"
            className="bg-transparent border-2 border-[var(--fest-texto)]/70 px-3 py-2.5 text-[15px] placeholder:opacity-50 focus:outline-none focus:border-[var(--fest-acento)]"
          />
            </>
          )}
          <button
            type="submit"
            disabled={enviando}
            className="fest-menu text-[16px] sm:text-[18px] leading-[1.3] py-2.5 border-2 border-[var(--fest-acento)] bg-[var(--fest-acento)] text-[#1A1A1A] enabled:hover:bg-[var(--fest-texto)] enabled:hover:border-[var(--fest-texto)] enabled:hover:text-[var(--fest-fondo)] transition-colors disabled:opacity-50"
          >
            {enviando ? t.tickets.preparando : t.medios[metodo].boton}
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
