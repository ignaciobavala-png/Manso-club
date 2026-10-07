'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatArs } from '@/lib/precios';
import { MEDIOS_PAGO, type MedioPago } from '@/lib/types/festival';
import { AYUDA, BOTON_ICONO, CARD, TITULO } from './festivalComun';

interface Venta {
  id: string;
  nombre: string;
  email: string;
  metodo: MedioPago;
  estado: 'pendiente' | 'pagada' | 'vencida';
  cantidad_entradas: number;
  total_ars: number;
  observacion: string | null;
  created_at: string;
}

type Filtro = 'por_confirmar' | 'pagadas' | 'todas';

const FILTROS: [Filtro, string][] = [
  ['por_confirmar', 'Por confirmar'],
  ['pagadas', 'Pagadas'],
  ['todas', 'Todas'],
];

/**
 * Las compras del festival. Lo que pide acción son las transferencias: la
 * persona manda el comprobante por WhatsApp con el código (los primeros 8
 * caracteres de la orden) y acá se confirma, lo que emite las entradas y les
 * manda el mail. Mercado Pago y cripto se confirman solos.
 */
export function FestivalVentasAdmin() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('por_confirmar');
  const [cargando, setCargando] = useState(true);
  const [confirmando, setConfirmando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    let consulta = supabase
      .from('festival_ordenes')
      .select('id, nombre, email, metodo, estado, cantidad_entradas, total_ars, observacion, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (filtro === 'por_confirmar') consulta = consulta.eq('metodo', 'transferencia').neq('estado', 'pagada');
    if (filtro === 'pagadas') consulta = consulta.eq('estado', 'pagada');
    const { data } = await consulta;
    setVentas(((data as Venta[] | null) ?? []).map(v => ({ ...v, total_ars: Number(v.total_ars) })));
    setCargando(false);
  }, [filtro]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const confirmar = async (venta: Venta) => {
    if (
      !confirm(
        `¿Confirmar el pago de ${venta.nombre} (${formatArs(venta.total_ars)})? Se emiten ${venta.cantidad_entradas} entrada(s) y le llega el mail a ${venta.email}.`
      )
    ) {
      return;
    }
    setConfirmando(venta.id);
    const res = await fetch(`/api/festival/ordenes/${venta.id}/confirmar`, { method: 'POST' });
    setConfirmando(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? 'No se pudo confirmar');
      return;
    }
    cargar();
  };

  return (
    <section className={CARD}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className={TITULO}>Ventas</h3>
          <p className={AYUDA}>
            Las transferencias se confirman a mano cuando llega el comprobante: el código que manda la persona son los
            primeros 8 caracteres de la orden. Mercado Pago y cripto se confirman solos.
          </p>
        </div>
        <button type="button" onClick={cargar} className={BOTON_ICONO} title="Actualizar">
          <RefreshCw size={13} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS.map(([valor, etiqueta]) => (
          <button
            key={valor}
            type="button"
            onClick={() => setFiltro(valor)}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors ${
              filtro === valor ? 'bg-manso-cream text-manso-black' : 'text-manso-cream/50 hover:text-manso-cream'
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {cargando ? (
        <Loader2 size={16} className="animate-spin text-manso-cream/40" />
      ) : ventas.length === 0 ? (
        <p className="text-[11px] text-manso-cream/40">
          {filtro === 'por_confirmar' ? 'No hay transferencias esperando confirmación.' : 'Todavía no hay ventas.'}
        </p>
      ) : (
        <ul className="divide-y divide-manso-cream/10">
          {ventas.map(v => (
            <li key={v.id} className="py-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-manso-cream truncate">
                  <span className="font-mono text-manso-cream/50 mr-2">{v.id.slice(0, 8).toUpperCase()}</span>
                  {v.nombre}
                </p>
                <p className="text-[11px] text-manso-cream/40 truncate">
                  {v.email} · {v.cantidad_entradas} entrada(s) · {MEDIOS_PAGO[v.metodo].nombre} ·{' '}
                  {new Date(v.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
                {v.observacion && <p className="text-[11px] text-manso-terra mt-0.5">{v.observacion}</p>}
              </div>
              <span className="text-sm font-mono text-manso-cream tabular-nums">{formatArs(v.total_ars)}</span>
              {v.estado === 'pagada' ? (
                <a
                  href={`/festival/compra/${v.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-manso-olive hover:text-manso-cream"
                >
                  Pagada <ExternalLink size={11} />
                </a>
              ) : v.metodo === 'transferencia' ? (
                <button
                  type="button"
                  onClick={() => confirmar(v)}
                  disabled={confirmando === v.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-manso-terra text-manso-cream text-[9px] font-black uppercase tracking-widest hover:bg-manso-terra/80 disabled:opacity-40"
                >
                  {confirmando === v.id ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                  Confirmar pago
                </button>
              ) : (
                <span className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40">
                  {v.estado === 'vencida' ? 'Vencida' : 'Esperando pago'}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
