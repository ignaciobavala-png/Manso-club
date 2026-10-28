'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatArs } from '@/lib/precios';
import type { DatoBancario } from '@/lib/datos-bancarios';
import { Copiar } from './PagoCripto';
import { useTextos } from './Idioma';

/**
 * Pantallas de pago en pesos de /blur/compra/[id], mientras la orden no
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
  const t = useTextos();
  const mensaje = t.transferencia.wsp(codigo, formatArs(totalArs));
  return (
    <>
      <h1 className="fest-angosta text-4xl sm:text-5xl leading-none">{t.transferencia.titulo}</h1>
      <p className="mt-4 text-[15px] opacity-75 max-w-[56ch]">
        {t.transferencia.texto(formatArs(totalArs))}
      </p>

      <dl className="mt-10 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 items-center max-w-[620px] border-t border-[var(--fest-texto)]/15 pt-6">
        <dt className="fest-mono opacity-55 uppercase tracking-[0.2em] text-[10px]">{t.transferencia.monto}</dt>
        <dd className="flex flex-wrap items-center gap-3">
          <span className="fest-angosta text-3xl tabular-nums">{formatArs(totalArs)}</span>
          <Copiar valor={String(totalArs)} etiqueta={t.transferencia.copiar} />
        </dd>
        {datos.map(d => (
          <div key={d.label} className="contents">
            <dt className="fest-mono opacity-55 uppercase tracking-[0.2em] text-[10px]">{d.label}</dt>
            <dd className="flex flex-wrap items-center gap-3 fest-mono text-[15px] break-all">
              {d.value}
              {(d.label === 'CBU' || d.label === 'Alias') && <Copiar valor={d.value} etiqueta={t.transferencia.copiar} />}
            </dd>
          </div>
        ))}
        <dt className="fest-mono opacity-55 uppercase tracking-[0.2em] text-[10px]">{t.transferencia.tuCodigo}</dt>
        <dd className="fest-mono text-[15px] tracking-[0.15em]">{codigo}</dd>
      </dl>

      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-8 fest-menu text-[16px] sm:text-[18px] leading-[1.3] px-6 py-2.5 bg-[var(--fest-acento)] text-[var(--fest-fondo)] hover:bg-[var(--fest-texto)] transition-colors"
        >
          {t.transferencia.mandarComprobante}
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
  const t = useTextos();
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
        {rechazado ? t.mp.rechazadoTitulo : t.mp.esperandoTitulo}
      </h1>
      <p className="mt-4 text-[15px] opacity-75 max-w-[56ch]">
        {rechazado ? t.mp.rechazadoTexto : t.mp.esperandoTexto}
      </p>
      {link && (
        <a
          href={link}
          className="inline-block mt-8 fest-menu text-[16px] sm:text-[18px] leading-[1.3] px-6 py-2.5 bg-[var(--fest-acento)] text-[var(--fest-fondo)] hover:bg-[var(--fest-texto)] transition-colors"
        >
          {rechazado ? t.mp.reintentar : t.mp.ir}
        </a>
      )}
    </>
  );
}
