'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { REDES, monedasDe, type EstadoPago, type RedCripto } from '@/lib/cripto-redes';

/**
 * Pantalla de pago en cripto: elegir red → monto exacto + dirección + QR →
 * esperar. Mientras está abierta pregunta el estado cada pocos segundos (y esa
 * consulta es la que hace leer la cadena); cuando la orden queda pagada,
 * refresca la página y el servidor muestra las entradas.
 *
 * El monto lleva centavos propios de esta orden: es lo que permite reconocer
 * el pago sin pedirle nada al comprador. Por eso se insiste en "exactamente".
 *
 * Con `demo` no toca la API: elegir red arma datos de ejemplo en el navegador
 * y la dirección es un texto que no es una dirección (`/festival/compra/demo`).
 */

/** Ni un formato de dirección válido: que nadie pueda mandarle plata a esto. */
export const DIRECCION_DEMO = 'EJEMPLO · NO MANDES NADA A ESTA DIRECCIÓN';

const CADA_MS = 8000;

export function PagoCripto({ ordenId, inicial, demo = false }: { ordenId: string; inicial: EstadoPago; demo?: boolean }) {
  const router = useRouter();
  const [estado, setEstado] = useState(inicial);
  const [eligiendo, setEligiendo] = useState<RedCripto | null>(null);
  const [cambiarRed, setCambiarRed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actualizar = useCallback(async () => {
    if (demo) return;
    const res = await fetch(`/api/festival/compra/${ordenId}`, { cache: 'no-store' });
    if (!res.ok) return;
    const nuevo: EstadoPago = await res.json();
    setEstado(nuevo);
    if (nuevo.estado === 'pagada') router.refresh();
  }, [ordenId, router, demo]);

  // Solo se consulta con una red elegida y la orden abierta.
  useEffect(() => {
    if (demo || !estado.red || estado.estado !== 'pendiente') return;
    const t = setInterval(actualizar, CADA_MS);
    return () => clearInterval(t);
  }, [demo, estado.red, estado.estado, actualizar]);

  const elegir = async (red: RedCripto) => {
    if (demo) {
      setEstado(e => ({
        ...e,
        estado: 'pendiente',
        red,
        monto: Math.round(e.totalUsd * 100 + 37) / 100,
        direccion: DIRECCION_DEMO,
        venceAt: new Date(Date.now() + 60 * 60_000).toISOString(),
      }));
      setCambiarRed(false);
      return;
    }
    setEligiendo(red);
    setError(null);
    try {
      const res = await fetch(`/api/festival/compra/${ordenId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ red }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No pudimos preparar el pago.');
      setEstado(data);
      setCambiarRed(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos preparar el pago.');
    } finally {
      setEligiendo(null);
    }
  };

  const conRed = estado.red && estado.monto !== null && estado.direccion;
  const mostrarSelector = !conRed || cambiarRed || estado.estado === 'vencida';

  return (
    <div>
      <h1 className="fest-angosta text-4xl sm:text-5xl leading-none">
        {estado.estado === 'vencida' ? 'El plazo para pagar venció' : 'Pagá con cripto'}
      </h1>
      <p className="mt-4 text-[15px] opacity-75 max-w-[560px]">
        {estado.estado === 'vencida'
          ? 'No recibimos el pago a tiempo. Si ya lo mandaste, pegá el hash más abajo; si no, generá el pago de nuevo.'
          : 'USDT, directo a la wallet de Manso. Las entradas aparecen acá y te llegan por mail apenas se confirma la transferencia.'}
      </p>

      {mostrarSelector && (
        <Paso numero="01" titulo={estado.estado === 'vencida' ? 'Elegí la red para pagar de nuevo' : 'Elegí la red'}>
          <ul className="grid sm:grid-cols-2 gap-3 max-w-[620px]">
            {estado.redes.map(red => {
              const actual = red === estado.red && estado.estado === 'pendiente';
              return (
                <li key={red}>
                  <button
                    type="button"
                    onClick={() => elegir(red)}
                    disabled={eligiendo !== null}
                    aria-pressed={actual}
                    className={`w-full h-full text-left border px-4 py-4 transition-colors disabled:opacity-50 ${
                      actual
                        ? 'border-[var(--fest-acento)] text-[var(--fest-acento)]'
                        : 'border-[var(--fest-texto)]/30 enabled:hover:border-[var(--fest-texto)]'
                    }`}
                  >
                    <span className="fest-angosta text-2xl leading-none block">{REDES[red].nombre}</span>
                    <span className="fest-mono text-[11px] uppercase tracking-[0.2em] opacity-70 block mt-2">
                      {eligiendo === red ? 'Preparando…' : `${monedasDe(red)} · ${REDES[red].estandar}`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 fest-mono text-[11px] uppercase tracking-[0.15em] opacity-60 leading-relaxed">
            Desde Lemon o Binance: BNB Smart Chain, que cobra menos comisión. Desde Bitso: Ethereum (Bitso no saca USDT por BEP20). Elegí acá la misma red que vas a usar para retirar.
          </p>
          {error && (
            <p role="alert" className="mt-3 fest-mono text-[11px] uppercase tracking-[0.2em] text-[var(--fest-acento)]">
              {error}
            </p>
          )}
        </Paso>
      )}

      {conRed && !cambiarRed && estado.estado === 'pendiente' && (
        <Instrucciones estado={estado} onCambiarRed={() => setCambiarRed(true)} />
      )}

      {estado.red && <ReclamoHash ordenId={ordenId} onAcreditado={actualizar} red={estado.red} demo={demo} />}
    </div>
  );
}

function Instrucciones({ estado, onCambiarRed }: { estado: EstadoPago; onCambiarRed: () => void }) {
  const red = REDES[estado.red!];
  const monto = estado.monto!.toFixed(2);
  const monedas = monedasDe(red.id);

  return (
    <>
      <Paso numero="01" titulo="Red">
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
          <p className="fest-angosta text-2xl leading-none">
            {red.nombre} <span className="fest-mono text-[11px] tracking-[0.2em] opacity-60 ml-2">{red.estandar}</span>
          </p>
          <button
            type="button"
            onClick={onCambiarRed}
            className="fest-mono text-[11px] uppercase tracking-[0.25em] underline opacity-70 hover:opacity-100"
          >
            Cambiar de red
          </button>
        </div>
      </Paso>

      <Paso numero="02" titulo="Mandá exactamente">
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
          <p className="fest-ancha text-5xl sm:text-7xl leading-[0.85] tabular-nums">{monto}</p>
          <p className="fest-angosta text-2xl leading-none pb-1">{monedas}</p>
          <Copiar valor={monto} etiqueta="Copiar monto" />
        </div>
        <p className="mt-5 text-[14px] text-[var(--fest-resalte)] max-w-[620px] leading-snug">
          Los centavos identifican tu compra: con otro monto no la podemos reconocer sola. Si el exchange cobra
          comisión de retiro, sumala para que lleguen {monto} justos.
        </p>
      </Paso>

      <Paso numero="03" titulo={`A esta dirección · ${red.nombre}`}>
        <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
          <QR valor={estado.direccion!} />
          <div className="min-w-0">
            <p className="fest-mono text-[15px] sm:text-lg break-all leading-snug">{estado.direccion}</p>
            <div className="mt-3">
              <Copiar valor={estado.direccion!} etiqueta="Copiar dirección" />
            </div>
            <p className="mt-4 text-[13px] opacity-70 leading-snug max-w-[460px]">
              Solo {monedas} en la red {red.nombre} ({red.estandar}). Otra moneda u otra red no llega y no se puede
              recuperar.
            </p>
          </div>
        </div>
      </Paso>

      <Esperando venceAt={estado.venceAt} />
    </>
  );
}

function Esperando({ venceAt }: { venceAt: string | null }) {
  // Arranca en null para que el HTML del servidor y el primer render del
  // navegador coincidan; el reloj empieza recién en el navegador.
  const [ahora, setAhora] = useState<number | null>(null);
  useEffect(() => {
    const tic = () => setAhora(Date.now());
    const primero = setTimeout(tic, 0);
    const t = setInterval(tic, 1000);
    return () => {
      clearTimeout(primero);
      clearInterval(t);
    };
  }, []);

  const restante = venceAt && ahora !== null ? Math.max(0, new Date(venceAt).getTime() - ahora) : null;
  const mm = restante === null ? null : String(Math.floor(restante / 60_000)).padStart(2, '0');
  const ss = restante === null ? null : String(Math.floor((restante % 60_000) / 1000)).padStart(2, '0');

  return (
    <div role="status" className="mt-10 border-y border-[var(--fest-texto)]/20 py-4 flex flex-wrap items-center gap-x-6 gap-y-2">
      <span className="flex items-center gap-3 fest-mono text-[12px] uppercase tracking-[0.25em]">
        <span className="relative flex w-2.5 h-2.5">
          <span className="absolute inset-0 rounded-full bg-[var(--fest-acento)] animate-ping opacity-60" />
          <span className="relative w-2.5 h-2.5 rounded-full bg-[var(--fest-acento)]" />
        </span>
        Esperando el pago
      </span>
      {mm !== null && (
        <span className="fest-mono text-[12px] uppercase tracking-[0.2em] opacity-60 tabular-nums">
          {restante === 0 ? 'Plazo vencido: si ya pagaste, igual se acredita' : `Tenés ${mm}:${ss} para mandarlo`}
        </span>
      )}
      <span className="fest-mono text-[11px] opacity-50 basis-full">
        La confirmación tarda de unos segundos a un par de minutos según la red. No hace falta recargar.
      </span>
    </div>
  );
}

function ReclamoHash({
  ordenId,
  red,
  onAcreditado,
  demo,
}: {
  ordenId: string;
  red: RedCripto;
  onAcreditado: () => void;
  demo: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [hash, setHash] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const verificar = async (ev: FormEvent) => {
    ev.preventDefault();
    if (demo) {
      setMensaje('Vista de ejemplo: acá se buscaría esa transacción en la red y, si llegó lo pedido, se acreditaría.');
      return;
    }
    setEnviando(true);
    setMensaje(null);
    try {
      const res = await fetch(`/api/festival/compra/${ordenId}/hash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash }),
      });
      const data = await res.json();
      if (data.ok) onAcreditado();
      else setMensaje(data.mensaje ?? 'No pudimos verificar la transacción.');
    } catch {
      setMensaje('No pudimos verificar la transacción.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mt-12">
      <button
        type="button"
        onClick={() => setAbierto(a => !a)}
        aria-expanded={abierto}
        className="fest-flecha fest-mono text-[11px] uppercase tracking-[0.25em] opacity-70 hover:opacity-100"
      >
        ¿Ya pagaste y no se acredita?
      </button>
      {abierto && (
        <form onSubmit={verificar} className="mt-4 grid gap-3 max-w-[620px]">
          <p className="text-[13px] opacity-70 leading-snug">
            Pegá el hash (o el link) de la transacción en {REDES[red].nombre}. Lo encontrás en el historial de tu
            wallet o, en Binance, en el detalle del retiro como &quot;TxID&quot;.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={hash}
              onChange={e => setHash(e.target.value)}
              placeholder="0xa1b2c3…"
              spellCheck={false}
              className="flex-1 min-w-0 bg-transparent border border-[var(--fest-texto)]/40 px-3 py-2.5 fest-mono text-[13px] placeholder:opacity-40 focus:outline-none focus:border-[var(--fest-acento)]"
            />
            <button
              type="submit"
              disabled={enviando || !hash.trim()}
              className="fest-angosta text-xl px-6 py-2.5 border border-[var(--fest-texto)]/60 enabled:hover:bg-[var(--fest-texto)] enabled:hover:text-[var(--fest-fondo)] transition-colors disabled:opacity-40"
            >
              {enviando ? 'Buscando…' : 'Verificar'}
            </button>
          </div>
          {mensaje && (
            <p role="alert" className="text-[13px] text-[var(--fest-resalte)] leading-snug">
              {mensaje}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

function Paso({ numero, titulo, children }: { numero: string; titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <p className="fest-mono text-[11px] uppercase tracking-[0.3em] opacity-60 mb-4">
        <span className="text-[var(--fest-acento)] opacity-100">{numero}</span> — {titulo}
      </p>
      {children}
    </section>
  );
}

export function Copiar({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  const [listo, setListo] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(valor);
          setListo(true);
          setTimeout(() => setListo(false), 1800);
        } catch {
          // Sin permiso de portapapeles el texto igual está a la vista para copiarlo a mano.
        }
      }}
      className="fest-mono text-[11px] uppercase tracking-[0.2em] border border-[var(--fest-texto)]/40 px-3 py-2 hover:border-[var(--fest-acento)] hover:text-[var(--fest-acento)] transition-colors"
    >
      {listo ? 'Copiado' : etiqueta}
    </button>
  );
}

function QR({ valor }: { valor: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    QRCode.toDataURL(valor, { width: 360, margin: 2, color: { dark: '#000000', light: '#FFFCDC' } })
      .then(setSrc)
      .catch(() => setSrc(null));
  }, [valor]);
  return (
    <div className="w-[168px] h-[168px] shrink-0 bg-[#FFFCDC]">
      {src && <img src={src} alt="QR de la dirección de pago" width={168} height={168} />}
    </div>
  );
}
