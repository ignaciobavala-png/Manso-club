import type { Metadata } from 'next';
import Link from 'next/link';
import { ORDEN_REDES, type EstadoPago } from '@/lib/cripto-redes';
import { formatArs, formatUsd } from '@/lib/precios';
import { PagoCripto } from '@/components/festival/PagoCripto';
import { CompraPagada, Dato, Marco, qrDeEntrada } from '@/components/festival/CompraPagada';

export const metadata: Metadata = { title: 'Pago con cripto (ejemplo)', robots: { index: false, follow: false } };

/**
 * Vista de ejemplo del pago en cripto, para mostrar la pantalla antes de que
 * existan las wallets. No crea órdenes ni lee la cadena: todo es inventado y
 * la "dirección" es un texto que no es una dirección. `?estado=pagada` muestra
 * cómo quedan las entradas después de pagar.
 */

const ORDEN = {
  nombre: 'Juana Ejemplo',
  email: 'juana@ejemplo.com',
  items: [
    { nombre: 'Early Bird', cantidad: 2, entradas: 1 },
    { nombre: 'Pack x3', cantidad: 1, entradas: 3 },
  ],
  totalArs: 234_000,
  totalUsd: 150.97,
};

export default async function DemoPagoCripto({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { estado } = await searchParams;
  const pagada = estado === 'pagada';

  const resumen = (
    <dl className="mt-12 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 fest-mono text-[13px] max-w-[620px]">
      <Dato titulo="A nombre de">{ORDEN.nombre}</Dato>
      <Dato titulo="Entradas">{ORDEN.items.map(i => `${i.cantidad} × ${i.nombre}`).join(' · ')}</Dato>
      <Dato titulo="Total">
        {formatUsd(ORDEN.totalUsd)} <span className="opacity-55">({formatArs(ORDEN.totalArs)} al blue)</span>
      </Dato>
    </dl>
  );

  const aviso = (
    <div className="mb-10 border border-[var(--fest-resalte)] text-[var(--fest-resalte)] px-4 py-3 fest-mono text-[11px] uppercase tracking-[0.2em] leading-relaxed flex flex-wrap gap-x-6 gap-y-2 items-center">
      <span>Vista de ejemplo · nada de esta página cobra · no mandes cripto</span>
      <span className="flex gap-4">
        <Link href="/festival/compra/demo" className={pagada ? 'underline' : 'opacity-50'}>
          Pago
        </Link>
        <Link href="/festival/compra/demo?estado=pagada" className={pagada ? 'opacity-50' : 'underline'}>
          Pago confirmado
        </Link>
      </span>
    </div>
  );

  if (pagada) {
    const tickets = await Promise.all(
      ORDEN.items
        .flatMap(i => Array.from({ length: i.cantidad * i.entradas }, () => i.nombre))
        .map(async (nombre, n) => {
          const codigo = `EJEMPLO${String(n + 1).padStart(5, '0')}`;
          return { id: codigo, entrada_nombre: nombre, codigo, usado: false, qr: await qrDeEntrada(codigo) };
        })
    );
    return (
      <Marco>
        {aviso}
        <CompraPagada
          email={ORDEN.email}
          tickets={tickets}
          pago={{ red: 'bsc', token: 'USDT', monto: 151.34, tx_hash: '' }}
        >
          {resumen}
        </CompraPagada>
      </Marco>
    );
  }

  const inicial: EstadoPago = {
    estado: 'pendiente',
    totalUsd: ORDEN.totalUsd,
    red: null,
    monto: null,
    direccion: null,
    venceAt: null,
    observacion: null,
    redes: ORDEN_REDES,
  };

  return (
    <Marco>
      {aviso}
      <PagoCripto ordenId="demo" inicial={inicial} demo />
      {resumen}
    </Marco>
  );
}
