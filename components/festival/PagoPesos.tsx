'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatArs } from '@/lib/precios';
import type { DatoBancario } from '@/lib/datos-bancarios';
import { Copiar } from './PagoCripto';

/**
 * Pantallas de pago en pesos de /festival/compra/[id], mientras la orden no
 * está pagada. Cuando se paga, la página pasa sola a mostrar los QR.
 */

/** Transferencia: los datos de la cuenta y a dónde mandar el comprobante. */
export function PagoTransferencia({
  codigo,
  totalArs,
  datos,
  whatsapp,
}: {
  /** Primeros caracteres del id de la orden, para que Ana la encuentre. */
  codigo: string;
  totalArs: number;
  datos: DatoBancario[];
  whatsapp: string | null;
}) {
  const mensaje = `Hola! Te mando el comprobante de la compra ${codigo} del festival (${formatArs(totalArs)}).`;
  return (
    <>
      <h1 className="fest-angosta text-4xl sm:text-5xl leading-none">Pagá por transferencia</h1>
      <p className="mt-4 text-[15px] opacity-75 max-w-[56ch]">
        Transferí exactamente {formatArs(totalArs)} y mandanos el comprobante. Cuando lo confirmamos te llegan las
        entradas por mail, y también aparecen en esta página.
      </p>

      <dl className="mt-10 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 items-center max-w-[620px] border-t border-[var(--fest-texto)]/15 pt-6">
        <dt className="fest-mono opacity-55 uppercase tracking-[0.2em] text-[10px]">Monto</dt>
        <dd className="flex flex-wrap items-center gap-3">
          <span className="fest-angosta text-3xl tabular-nums">{formatArs(totalArs)}</span>
          <Copiar valor={String(totalArs)} etiqueta="Copiar" />
        </dd>
        {datos.map(d => (
          <div key={d.label} className="contents">
            <dt className="fest-mono opacity-55 uppercase tracking-[0.2em] text-[10px]">{d.label}</dt>
            <dd className="flex flex-wrap items-center gap-3 fest-mono text-[15px] break-all">
              {d.value}
              {(d.label === 'CBU' || d.label === 'Alias') && <Copiar valor={d.value} etiqueta="Copiar" />}
            </dd>
          </div>
        ))}
        <dt className="fest-mono opacity-55 uppercase tracking-[0.2em] text-[10px]">Tu código</dt>
        <dd className="fest-mono text-[15px] tracking-[0.15em]">{codigo}</dd>
      </dl>

      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-8 fest-menu text-[16px] sm:text-[18px] leading-[1.3] px-6 py-2.5 bg-[var(--fest-acento)] text-[var(--fest-fondo)] hover:bg-[var(--fest-texto)] transition-colors"
        >
          Mandar comprobante
        </a>
      )}
    </>
  );
}

/**
 * Mercado Pago todavía sin confirmar: o la persona volvió antes de que llegara
 * el aviso, o el pago quedó pendiente (efectivo, revisión), o no lo terminó.
 * Recarga sola un rato por si el aviso está en camino.
 */
export function EsperandoMP({ link, rechazado }: { link: string | null; rechazado: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (rechazado) return;
    let vueltas = 0;
    const t = setInterval(() => {
      if (++vueltas > 36) return clearInterval(t);
      router.refresh();
    }, 5000);
    return () => clearInterval(t);
  }, [router, rechazado]);

  return (
    <>
      <h1 className="fest-angosta text-4xl sm:text-5xl leading-none">
        {rechazado ? 'El pago no se aprobó' : 'Esperando a Mercado Pago'}
      </h1>
      <p className="mt-4 text-[15px] opacity-75 max-w-[56ch]">
        {rechazado
          ? 'Mercado Pago rechazó el pago. Podés intentar de nuevo con otro medio.'
          : 'Si ya pagaste, en unos segundos esta página muestra tus entradas y te llegan por mail. Si el pago quedó pendiente (por ejemplo, en efectivo), aparecen cuando se acredite.'}
      </p>
      {link && (
        <a
          href={link}
          className="inline-block mt-8 fest-menu text-[16px] sm:text-[18px] leading-[1.3] px-6 py-2.5 bg-[var(--fest-acento)] text-[var(--fest-fondo)] hover:bg-[var(--fest-texto)] transition-colors"
        >
          {rechazado ? 'Intentar de nuevo' : 'Ir a pagar'}
        </a>
      )}
    </>
  );
}
