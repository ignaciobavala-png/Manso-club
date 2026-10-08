import QRCode from 'qrcode';
import { REDES, type RedCripto } from '@/lib/cripto-redes';
import { EscribeTexto } from './Escribe';

/**
 * Piezas de /blur/compra/[id] que comparte con la demo
 * (/blur/compra/demo): el marco de la página, una fila del resumen y la
 * vista de la compra pagada con un QR por entrada.
 */

export interface EntradaConQr {
  id: string;
  entrada_nombre: string;
  codigo: string;
  usado: boolean;
  qr: string;
}

export const qrDeEntrada = (codigo: string) =>
  QRCode.toDataURL(codigo, { width: 220, margin: 1, color: { dark: '#000000', light: '#FFFCDC' } });

export function CompraPagada({
  email,
  tickets,
  pago,
  medio,
  children,
}: {
  email: string;
  tickets: EntradaConQr[];
  /** El pago en cripto, con link a la transacción. */
  pago: { red: RedCripto; token: string; monto: number; tx_hash: string } | null;
  /** Para los pagos en pesos, que no tienen transacción: "Mercado Pago", "transferencia". */
  medio?: string;
  /** El resumen de la compra (a nombre de, entradas, total). */
  children: React.ReactNode;
}) {
  return (
    <>
      <h1 className="fest-angosta text-4xl sm:text-5xl leading-none">Pago confirmado</h1>
      <p className="mt-4 text-[15px] opacity-75">
        Cada QR es una entrada. Guardá este link: también te lo mandamos a {email}.
      </p>

      <ul className="mt-12 grid gap-6 sm:grid-cols-2">
        {tickets.map((t, i) => (
          <li key={t.id} className="border border-[var(--fest-texto)]/25 p-5 flex gap-5 items-center">
            <img src={t.qr} alt={`QR de la entrada ${t.codigo}`} width={120} height={120} className="shrink-0" />
            <div className="min-w-0">
              <p className="fest-mono text-[10px] uppercase tracking-[0.25em] opacity-55">
                Entrada {i + 1} de {tickets.length}
              </p>
              <p className="fest-angosta text-2xl leading-none mt-1.5">{t.entrada_nombre}</p>
              <p className="fest-mono text-sm mt-2 tracking-[0.15em]">{t.codigo}</p>
              {t.usado && <p className="fest-mono text-[10px] uppercase mt-1 text-[var(--fest-acento)]">Usada</p>}
            </div>
          </li>
        ))}
      </ul>

      {children}
      {!pago && medio && <p className="mt-3 fest-mono text-[12px] opacity-60">Pagado con {medio}</p>}
      {pago && (
        <p className="mt-3 fest-mono text-[12px] opacity-60">
          Pagado con {pago.monto} {pago.token} en {REDES[pago.red].nombre}
          {pago.tx_hash && (
            <>
              {' · '}
              <a href={REDES[pago.red].explorador(pago.tx_hash)} target="_blank" rel="noreferrer" className="underline">
                ver transacción
              </a>
            </>
          )}
        </p>
      )}
    </>
  );
}

export function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 sm:px-7 pt-6 sm:pt-10 pb-20 sm:pb-24 fest-entra max-w-[980px]">
      <p className="fest-rotulo mb-8">
        <EscribeTexto texto="Tu compra" />
      </p>
      {children}
    </div>
  );
}

export function Dato({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="opacity-55 uppercase tracking-[0.2em] text-[10px] self-center">{titulo}</dt>
      <dd>{children}</dd>
    </>
  );
}
