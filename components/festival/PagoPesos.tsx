'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatArs } from '@/lib/precios';
import type { DatoBancario } from '@/lib/datos-bancarios';
import { codificarFoto, medidaConTope } from '@/lib/comprimir-imagen';
import { Copiar } from './PagoCripto';
import { useTextos } from './Idioma';

/**
 * Pantallas de pago en pesos de /blur/compra/[id], mientras la orden no
 * está pagada. Cuando se paga, la página pasa sola a mostrar los QR.
 */

/**
 * Transferencia en tres pasos: transferir, subir el comprobante y avisar
 * ("Ya transferí"). El aviso es una declaración: Ana sigue confirmando contra
 * el banco, pero ve las órdenes con comprobante y aviso aparte de las que se
 * quedaron a mitad de camino. Una reserva vencida (48 h sin aviso) ya no se
 * puede avisar: se muestra cómo seguir.
 */
export function PagoTransferencia({
  ordenId,
  codigo,
  totalArs,
  datos,
  whatsapp,
  comprobanteAt,
  declaradaAt,
  vencida,
}: {
  ordenId: string;
  /** Primeros caracteres del id de la orden, para que Ana la encuentre. */
  codigo: string;
  totalArs: number;
  datos: DatoBancario[];
  whatsapp: string | null;
  /** Cuándo subió el comprobante; null si todavía no. */
  comprobanteAt: string | null;
  /** Cuándo apretó "Ya transferí"; null si todavía no. */
  declaradaAt: string | null;
  vencida: boolean;
}) {
  const t = useTextos();
  const mensaje = t.transferencia.wsp(codigo, formatArs(totalArs));
  const linkWsp = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}` : null;

  if (vencida) {
    return (
      <>
        <h1 className="fest-angosta text-4xl sm:text-5xl leading-none">{t.transferencia.vencidoTitulo}</h1>
        <p className="mt-4 text-[15px] opacity-75 max-w-[56ch]">{t.transferencia.vencidoTexto}</p>
        {linkWsp && (
          <a href={linkWsp} target="_blank" rel="noopener noreferrer" className={`mt-8 ${BOTON}`}>
            {t.transferencia.mandarComprobante}
          </a>
        )}
      </>
    );
  }

  return (
    <>
      <h1 className="fest-angosta text-4xl sm:text-5xl leading-none">{t.transferencia.titulo}</h1>
      <p className="mt-4 text-[15px] opacity-75 max-w-[56ch]">
        {t.transferencia.texto(formatArs(totalArs))}
      </p>

      <p className="mt-10 fest-mono opacity-55 uppercase tracking-[0.2em] text-[10px]">{t.transferencia.paso1}</p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 items-center max-w-[620px] border-t border-[var(--fest-texto)]/15 pt-6">
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

      <AvisarPago ordenId={ordenId} inicialSubido={Boolean(comprobanteAt)} inicialAvisado={Boolean(declaradaAt)} whatsapp={linkWsp} />
    </>
  );
}

const BOTON =
  'inline-block fest-menu text-[16px] sm:text-[18px] leading-[1.3] px-6 py-2.5 bg-[var(--fest-acento)] text-[var(--fest-fondo)] hover:bg-[var(--fest-texto)] transition-colors disabled:opacity-50';

/** Carga el archivo en un <img> para poder dibujarlo en un canvas. */
function leerImagen(archivo: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(archivo);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen'));
    };
    img.src = url;
  });
}

/** Una foto de celular pesa varios MB: se achica antes de subirla, un PDF va tal cual. */
async function prepararComprobante(archivo: File): Promise<Blob> {
  if (archivo.type === 'application/pdf') return archivo;
  const img = await leerImagen(archivo);
  const [w, h] = medidaConTope(img.width, img.height, 1800);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
  // Un comprobante tiene que seguir leyéndose: tope más holgado que el de las fotos del sitio.
  return (await codificarFoto(canvas, 700_000)).blob;
}

/** Pasos 2 y 3: subir el comprobante y avisar "Ya transferí". El WhatsApp queda como alternativa. */
function AvisarPago({
  ordenId,
  inicialSubido,
  inicialAvisado,
  whatsapp,
}: {
  ordenId: string;
  inicialSubido: boolean;
  inicialAvisado: boolean;
  whatsapp: string | null;
}) {
  const t = useTextos().transferencia;
  const input = useRef<HTMLInputElement>(null);
  const [subido, setSubido] = useState(inicialSubido);
  const [subiendo, setSubiendo] = useState(false);
  const [avisado, setAvisado] = useState(inicialAvisado);
  const [avisando, setAvisando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subir = async (archivo: File) => {
    setError(null);
    const esPdf = archivo.type === 'application/pdf';
    if (!esPdf && !archivo.type.startsWith('image/')) return setError(t.errorTipo);
    if (esPdf && archivo.size > 4 * 1024 * 1024) return setError(t.errorPeso);
    setSubiendo(true);
    try {
      const blob = await prepararComprobante(archivo);
      const datos = new FormData();
      datos.append('archivo', new File([blob], 'comprobante', { type: blob.type }));
      const res = await fetch(`/api/festival/compra/${ordenId}/comprobante`, { method: 'POST', body: datos });
      if (!res.ok) throw new Error();
      setSubido(true);
    } catch {
      setError(t.errorSubida);
    } finally {
      setSubiendo(false);
    }
  };

  const avisar = async () => {
    setError(null);
    setAvisando(true);
    try {
      const res = await fetch(`/api/festival/compra/${ordenId}/declarar`, { method: 'POST' });
      if (!res.ok) throw new Error();
      setAvisado(true);
    } catch {
      setError(t.errorAviso);
    } finally {
      setAvisando(false);
    }
  };

  const eligirArchivo = (
    <input
      ref={input}
      type="file"
      accept="image/*,application/pdf"
      className="hidden"
      onChange={e => {
        const archivo = e.target.files?.[0];
        e.target.value = '';
        if (archivo) void subir(archivo);
      }}
    />
  );

  if (avisado) {
    return (
      <div className="mt-10 max-w-[620px] border border-[var(--fest-acento)]/50 p-5">
        <p className="fest-menu text-[20px] text-[var(--fest-acento)]">✓ {t.avisadoTitulo}</p>
        <p className="mt-2 text-[14px] opacity-75">{t.avisadoTexto}</p>
      </div>
    );
  }

  return (
    <>
      {eligirArchivo}
      <p className="mt-10 fest-mono opacity-55 uppercase tracking-[0.2em] text-[10px]">{t.paso2}</p>
      <div className="mt-3 max-w-[620px] border border-dashed border-[var(--fest-texto)]/30 p-5">
        {subido ? (
          <>
            <p className="fest-menu text-[18px] text-[var(--fest-acento)]">✓ {t.comprobanteListo}</p>
            <button type="button" disabled={subiendo} onClick={() => input.current?.click()} className="mt-3 text-[13px] underline opacity-70 hover:opacity-100">
              {subiendo ? t.subiendo : t.reemplazar}
            </button>
          </>
        ) : (
          <>
            <p className="mb-4 text-[13px] opacity-65">{t.subirTexto}</p>
            <button type="button" disabled={subiendo} onClick={() => input.current?.click()} className={BOTON}>
              {subiendo ? t.subiendo : t.subir}
            </button>
            {whatsapp && (
              <p className="mt-4 text-[12px] opacity-60">
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="underline">
                  {t.oPorWsp}
                </a>
              </p>
            )}
          </>
        )}
      </div>

      <p className={`mt-8 fest-mono uppercase tracking-[0.2em] text-[10px] ${subido ? 'opacity-55' : 'opacity-30'}`}>{t.paso3}</p>
      <div className="mt-3 max-w-[620px]">
        <button type="button" disabled={!subido || avisando} onClick={avisar} className={BOTON}>
          {avisando ? t.avisando : t.yaTransferi}
        </button>
        <p className="mt-3 text-[12px] opacity-55 max-w-[56ch]">{t.avisoAdvertencia}</p>
      </div>
      {error && <p role="alert" className="mt-4 text-[13px] text-[var(--fest-acento)]">{error}</p>}
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
