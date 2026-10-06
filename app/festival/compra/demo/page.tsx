import type { Metadata } from 'next';
import Link from 'next/link';
import { ORDEN_REDES, type EstadoPago } from '@/lib/cripto-redes';
import { formatArs, formatUsd } from '@/lib/precios';
import { getCotizacionDolar } from '@/lib/dolar';
import { leerEntradas } from '@/lib/festival';
import { PagoCripto } from '@/components/festival/PagoCripto';
import { CompraPagada, Dato, Marco, qrDeEntrada } from '@/components/festival/CompraPagada';

export const metadata: Metadata = { title: 'Pago con cripto (ejemplo)', robots: { index: false, follow: false } };

/**
 * Vista de ejemplo del pago en cripto, para mostrar la pantalla antes de que
 * existan las wallets. No crea órdenes ni lee la cadena: todo es inventado y
 * la "dirección" es un texto que no es una dirección. `?estado=pagada` muestra
 * cómo quedan las entradas después de pagar.
 *
 * Mientras no haya wallets cargadas, COMPRAR en la tabla trae acá lo elegido
 * (`?items=<id>:<cantidad>,…&nombre=…`), con los precios reales del panel.
 * Sin `items`, muestra una compra de ejemplo fija.
 */

type OrdenDemo = {
  nombre: string;
  email: string;
  items: { nombre: string; cantidad: number; entradas: number }[];
  totalArs: number;
  totalUsd: number;
};

const EJEMPLO: OrdenDemo = {
  nombre: 'Juana Ejemplo',
  email: 'juana@ejemplo.com',
  items: [
    { nombre: 'Early Bird', cantidad: 2, entradas: 1 },
    { nombre: 'Pack x3', cantidad: 1, entradas: 3 },
  ],
  totalArs: 234_000,
  totalUsd: 150.97,
};

/** Arma la orden con las entradas reales; ante cualquier dato raro, el ejemplo fijo. */
async function ordenDesde(items?: string, nombre?: string): Promise<OrdenDemo> {
  if (!items) return EJEMPLO;
  const entradas = await leerEntradas();
  const elegidas = items
    .split(',')
    .map(par => {
      const [id, cant] = par.split(':');
      const entrada = entradas.find(e => e.id === id);
      const cantidad = Math.min(Number(cant) || 0, entrada?.max_por_compra ?? 0);
      return entrada && cantidad > 0 ? { entrada, cantidad } : null;
    })
    .filter(x => x !== null);
  if (elegidas.length === 0) return EJEMPLO;

  const totalArs = elegidas.reduce((acc, { entrada, cantidad }) => acc + entrada.precio * cantidad, 0);
  const cotizacion = await getCotizacionDolar()
    .then(c => c.venta)
    .catch(() => EJEMPLO.totalArs / EJEMPLO.totalUsd);
  return {
    nombre: nombre?.trim().slice(0, 120) || EJEMPLO.nombre,
    email: EJEMPLO.email,
    items: elegidas.map(({ entrada, cantidad }) => ({
      nombre: entrada.nombre,
      cantidad,
      entradas: entrada.entradas_por_unidad,
    })),
    totalArs,
    totalUsd: Math.round((totalArs / cotizacion) * 100) / 100,
  };
}

export default async function DemoPagoCripto({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; items?: string; nombre?: string }>;
}) {
  const { estado, items, nombre } = await searchParams;
  const pagada = estado === 'pagada';
  const ORDEN = await ordenDesde(items, nombre);
  const base = new URLSearchParams();
  if (items) base.set('items', items);
  if (nombre) base.set('nombre', nombre);
  const conEstado = new URLSearchParams(base);
  conEstado.set('estado', 'pagada');
  const urlPago = `/festival/compra/demo${base.size ? `?${base}` : ''}`;
  const urlPagada = `/festival/compra/demo?${conEstado}`;

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
        <Link href={urlPago} className={pagada ? 'underline' : 'opacity-50'}>
          Pago
        </Link>
        <Link href={urlPagada} className={pagada ? 'opacity-50' : 'underline'}>
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
          pago={{ red: 'bsc', token: 'USDT', monto: Math.round(ORDEN.totalUsd * 100 + 37) / 100, tx_hash: '' }}
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
