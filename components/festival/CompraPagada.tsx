import QRCode from 'qrcode';
import { REDES, type RedCripto } from '@/lib/cripto-redes';
import { EscribeTexto } from './Escribe';
import { QrEntrada } from './QrEntrada';
import { AccionesCompra } from './AccionesCompra';
import { leerTextos } from '@/lib/festival-idioma-servidor';

/**
 * Piezas de /blurfestival/compra/[id] que comparte con la demo
 * (/blurfestival/compra/demo): el marco de la página, una fila del resumen y la
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
  QRCode.toDataURL(codigo, { width: 480, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#FFFFFF' } });

export async function CompraPagada({
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
  const { t: L } = await leerTextos();
  return (
    <>
      <h1 className="fest-angosta text-4xl sm:text-5xl leading-none">{L.compra.pagoConfirmado}</h1>
      <p className="mt-4 text-[15px] opacity-75">{L.compra.qrIntro(email)}</p>

      <ul className="mt-10 grid gap-6 sm:grid-cols-2">
        {tickets.map((t, i) => (
          <QrEntrada
            key={t.id}
            qr={t.qr}
            alt={L.compra.qrAlt(t.codigo)}
            titulo={t.entrada_nombre}
            codigo={t.codigo}
            rotulo={L.compra.entradaN(i + 1, tickets.length)}
            usado={t.usado}
            nombreArchivo={`entrada-${i + 1}-de-${tickets.length}.png`}
          />
        ))}
      </ul>

      <AccionesCompra />

      {children}
      {!pago && medio && <p className="mt-3 fest-mono text-[12px] opacity-60">{L.compra.pagadoCon(medio)}</p>}
      {pago && (
        <p className="mt-3 fest-mono text-[12px] opacity-60">
          {L.compra.pagadoConCripto(pago.monto, pago.token, REDES[pago.red].nombre)}
          {pago.tx_hash && (
            <>
              {' · '}
              <a href={REDES[pago.red].explorador(pago.tx_hash)} target="_blank" rel="noreferrer" className="underline">
                {L.compra.verTransaccion}
              </a>
            </>
          )}
        </p>
      )}
    </>
  );
}

export async function Marco({ children }: { children: React.ReactNode }) {
  const { t } = await leerTextos();
  return (
    <div className="px-4 sm:px-7 pt-6 sm:pt-10 pb-20 sm:pb-24 fest-entra max-w-[980px]">
      <p className="fest-rotulo mb-8">
        <EscribeTexto texto={t.compra.marco} />
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
