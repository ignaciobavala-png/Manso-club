'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { formatArs } from '@/lib/precios';
import type { VentaGestion } from '@/lib/gestion-entradas';
import { AYUDA } from './festivalComun';

type Estado = 'Vendida' | 'Reservada' | 'Rechazada' | 'Sin pagar';

/** Tal cual lo dice Gestión: no se reinterpreta, y "verificada" va aparte de "vendida". */
const estadoDe = (v: VentaGestion): Estado =>
  v.vendida ? 'Vendida' : v.reservada ? 'Reservada' : v.rechazada ? 'Rechazada' : 'Sin pagar';

const COLOR_ESTADO: Record<Estado, string> = {
  Vendida: 'bg-manso-olive/20 text-manso-olive',
  Reservada: 'bg-manso-cream/10 text-manso-cream/60',
  Rechazada: 'bg-manso-terra/20 text-manso-terra',
  'Sin pagar': 'bg-manso-cream/10 text-manso-cream/62',
};

type Origen = VentaGestion['origen'];
const ORIGENES: [Origen, string][] = [
  ['web', 'Web'],
  ['gestion', 'Manual'],
];

const fecha = (iso: string) => new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

/**
 * Todas las entradas del festival que hay en Manso Gestión, la fuente de verdad:
 * las que vendió la web y las que se cargaron a mano (transferencias, efectivo).
 * Es solo lectura; lo manual se gestiona desde Gestión. Confirmar, descartar y
 * borrar siguen siendo de las órdenes de la web, en la otra vista.
 */
export function FestivalVentasGestion() {
  const [ventas, setVentas] = useState<VentaGestion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch('/api/festival/ventas-gestion', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'No se pudieron leer las ventas de Gestión');
      setVentas(data.ventas as VentaGestion[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron leer las ventas de Gestión');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const totales = useMemo(
    () =>
      ORIGENES.map(([origen, etiqueta]) => {
        const filas = ventas.filter(v => v.origen === origen);
        const vendidas = filas.filter(v => v.vendida);
        const verificadas = vendidas.filter(v => v.payment_verified);
        const sinMail = vendidas.filter(v => !v.qr_mail_enviado_at);
        return {
          origen,
          etiqueta,
          total: filas.length,
          vendidas: vendidas.length,
          verificadas: verificadas.length,
          sinMail: sinMail.length,
          monto: vendidas.reduce((suma, v) => suma + (v.precio ?? 0), 0),
        };
      }),
    [ventas]
  );

  if (cargando) return <Loader2 size={16} className="animate-spin text-manso-cream/62" />;
  if (error) {
    return (
      <p className="text-[13px] text-manso-terra">
        {error}.{' '}
        <button type="button" onClick={cargar} className="underline hover:text-manso-cream">
          Reintentar
        </button>
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {totales.map(t => (
          <div key={t.origen} className="rounded-xl border border-manso-cream/10 p-3 space-y-1">
            <p className="text-[12px] font-black uppercase tracking-widest text-manso-cream/50">
              {t.etiqueta} · {t.total} {t.total === 1 ? 'entrada' : 'entradas'}
            </p>
            <p className="text-[15px] text-manso-cream">
              <span className="font-mono tabular-nums">{t.vendidas}</span> vendidas ·{' '}
              <span className="font-mono tabular-nums">{t.verificadas}</span> verificadas ·{' '}
              <span className="font-mono tabular-nums">{formatArs(t.monto)}</span>
            </p>
            <p className={`text-[13px] ${t.sinMail > 0 ? 'text-manso-terra' : 'text-manso-cream/62'}`}>
              {t.sinMail > 0 ? `${t.sinMail} vendidas sin mail del QR` : 'Todas las vendidas tienen el mail del QR enviado'}
            </p>
          </div>
        ))}
      </div>
      <p className={AYUDA}>
        «Vendida» es lo que cuenta Gestión: una transferencia cargada a mano es vendida desde que se carga. «Verificada» dice si ya
        se confirmó contra el banco. El monto suma las vendidas.
      </p>

      {ventas.length === 0 ? (
        <p className="text-[13px] text-manso-cream/62">Gestión no tiene entradas de este festival.</p>
      ) : (
        <ul className="divide-y divide-manso-cream/10">
          {ventas.map(v => {
            const estado = estadoDe(v);
            return (
              <li key={v.registro_id} className="py-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] text-manso-cream truncate">
                    {v.nombre}
                    <span
                      className={`ml-2 align-middle px-2 py-0.5 rounded-full text-[12px] font-black uppercase tracking-widest ${COLOR_ESTADO[estado]}`}
                    >
                      {estado}
                    </span>
                    {v.vendida && (
                      <span
                        className={`ml-1 align-middle px-2 py-0.5 rounded-full text-[12px] font-black uppercase tracking-widest ${
                          v.qr_mail_enviado_at ? 'bg-manso-olive/20 text-manso-olive' : 'bg-manso-terra/20 text-manso-terra'
                        }`}
                        title={v.qr_mail_enviado_at ? `Mail del QR enviado el ${fecha(v.qr_mail_enviado_at)}` : 'Gestión no registra que se haya mandado el mail con el QR'}
                      >
                        {v.qr_mail_enviado_at ? 'Mail QR enviado' : 'Sin mail QR'}
                      </span>
                    )}
                    {v.vendida && (
                      <span
                        className={`ml-1 align-middle px-2 py-0.5 rounded-full text-[12px] font-black uppercase tracking-widest ${
                          v.payment_verified ? 'bg-manso-olive/20 text-manso-olive' : 'bg-manso-cream/10 text-manso-cream/62'
                        }`}
                      >
                        {v.payment_verified ? 'Verificada' : 'Sin verificar'}
                      </span>
                    )}
                  </p>
                  <p className="text-[13px] text-manso-cream/62 truncate">
                    {v.email} · {v.tipo ?? 'Sin tipo'} · {v.evento} · {v.origen === 'web' ? 'Web' : 'Manual'} · {fecha(v.registered_at)}
                    {v.vendida && v.qr_mail_enviado_at ? ` · mail QR ${fecha(v.qr_mail_enviado_at)}` : ''}
                  </p>
                </div>
                <span className="text-[15px] font-mono text-manso-cream tabular-nums">{v.precio === null ? '—' : formatArs(v.precio)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
