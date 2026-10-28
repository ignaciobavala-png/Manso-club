'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { formatArs } from '@/lib/precios';
import { ESTADOS_ENTRADA, etiquetaEstado, type EstadoEntrada } from '@/lib/types/festival';
import type { TipoGestionAdmin } from '@/lib/gestion-entradas';
import { AYUDA, BOTON_AGREGAR, BOTON_GUARDAR, BOTON_ICONO, CARD, INPUT, LABEL, TITULO } from './festivalComun';

type Conexion = { cargando: true } | { cargando: false; conectado: boolean };

/** Lo que se escribe en el formulario: todo texto, para poder dejar vacío el cupo y el tope. */
interface Borrador {
  id?: string;
  nombre: string;
  descripcion: string;
  precio: string;
  entradasPorUnidad: string;
  cupo: string;
  maxPorCompra: string;
  estado: EstadoEntrada;
  activo: boolean;
}

const vacio = (): Borrador => ({
  nombre: '',
  descripcion: '',
  precio: '',
  entradasPorUnidad: '1',
  cupo: '',
  maxPorCompra: '',
  estado: 'en_venta',
  activo: true,
});

const aBorrador = (t: TipoGestionAdmin): Borrador => ({
  id: t.id,
  nombre: t.nombre,
  descripcion: t.descripcion ?? '',
  precio: String(t.precio),
  entradasPorUnidad: String(t.entradas_por_unidad),
  cupo: t.cupo === null ? '' : String(t.cupo),
  maxPorCompra: t.max_por_compra === null ? '' : String(t.max_por_compra),
  estado: t.estado,
  activo: t.activo,
});

/** Vacío = null (sin tope); si no es un entero, NaN y el servidor lo rechaza. */
const entero = (v: string) => (v.trim() === '' ? null : Number(v.trim()));

/**
 * La sección Entradas del panel. Con la venta conectada a Manso Gestión los
 * tipos viven allá (el stock es uno solo para la web y la app), pero se editan
 * también desde acá: cada guardado es una llamada a Gestión, no una copia.
 * Sin conectar, muestra el editor de siempre (`children`).
 */
export function FestivalEntradasGestion({ children }: { children: React.ReactNode }) {
  const [conexion, setConexion] = useState<Conexion>({ cargando: true });
  const [tipos, setTipos] = useState<TipoGestionAdmin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<Borrador | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const res = await fetch('/api/festival/gestion/tipos');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? 'Gestión no respondió.');
      return;
    }
    setError(null);
    setTipos(data.tipos ?? []);
  }, []);

  useEffect(() => {
    fetch('/api/festival/gestion')
      .then(r => r.json())
      .then(async data => {
        setConexion({ cargando: false, conectado: Boolean(data.conectado) });
        if (data.conectado) await cargar();
      })
      .catch(() => setConexion({ cargando: false, conectado: false }));
  }, [cargar]);

  if (conexion.cargando) return <Loader2 size={16} className="animate-spin text-manso-cream/40" />;
  if (!conexion.conectado) return <>{children}</>;

  const guardar = async () => {
    if (!editando) return;
    setOcupado('guardar');
    const res = await fetch('/api/festival/gestion/tipos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editando.id,
        nombre: editando.nombre,
        descripcion: editando.descripcion,
        precio: Number(editando.precio.replace(',', '.')),
        entradas_por_unidad: Number(editando.entradasPorUnidad),
        cupo: entero(editando.cupo),
        max_por_compra: entero(editando.maxPorCompra),
        estado: editando.estado,
        activo: editando.activo,
      }),
    });
    setOcupado(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? 'No se pudo guardar');
      return;
    }
    setEditando(null);
    await cargar();
  };

  const borrar = async (t: TipoGestionAdmin) => {
    if (!confirm(`¿Borrar "${t.nombre}"? No se puede deshacer.`)) return;
    setOcupado(t.id);
    const res = await fetch(`/api/festival/gestion/tipos?id=${t.id}`, { method: 'DELETE' });
    setOcupado(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? 'No se pudo borrar');
      return;
    }
    await cargar();
  };

  const campo = (cambios: Partial<Borrador>) => setEditando(e => (e ? { ...e, ...cambios } : e));

  return (
    <section className={CARD}>
      <div>
        <h3 className={TITULO}>Entradas</h3>
        <p className={AYUDA}>
          La venta está conectada a Manso Gestión: los tipos, precios, cupos y estados se pueden editar acá o allá, es lo
          mismo. El stock es uno solo para la web y la app. El cupo cuenta entradas (un pack x3 son 3).
        </p>
      </div>

      {error ? (
        <p className="text-[11px] text-manso-terra">{error}</p>
      ) : (
        <ul className="divide-y divide-manso-cream/10">
          {tipos.map(t => (
            <li key={t.id} className={`py-3 flex flex-wrap items-center gap-x-4 gap-y-1 ${t.activo ? '' : 'opacity-50'}`}>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-manso-cream truncate">{t.nombre}</p>
                <p className="text-[11px] text-manso-cream/40">
                  {t.activo ? etiquetaEstado(t.estado) : 'Oculto'}
                  {t.entradas_por_unidad > 1 && ` · ${t.entradas_por_unidad} entradas por unidad`}
                  {' · '}
                  {t.cupo === null ? 'sin cupo propio' : `cupo ${t.cupo}`}
                  {' · '}
                  {t.ocupadas} vendidas o reservadas
                </p>
              </div>
              <span className="text-sm font-mono text-manso-cream tabular-nums">{formatArs(t.precio)}</span>
              <button
                type="button"
                onClick={() => setEditando(aBorrador(t))}
                className={BOTON_ICONO}
                title="Editar"
                aria-label={`Editar ${t.nombre}`}
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                onClick={() => borrar(t)}
                disabled={t.ocupadas > 0 || ocupado === t.id}
                className={BOTON_ICONO}
                title={t.ocupadas > 0 ? 'Tiene entradas vendidas: ocultalo en vez de borrarlo' : 'Borrar'}
                aria-label={`Borrar ${t.nombre}`}
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
          {tipos.length === 0 && (
            <li className="py-3 text-[11px] text-manso-cream/40">El evento no tiene tipos de entrada cargados.</li>
          )}
        </ul>
      )}

      {editando && (
        <div className="border border-manso-cream/10 rounded-xl p-4 space-y-3">
          <p className={TITULO}>{editando.id ? 'Editar tipo' : 'Nuevo tipo'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label>
              <span className={LABEL}>Nombre</span>
              <input className={INPUT} value={editando.nombre} onChange={e => campo({ nombre: e.target.value })} />
            </label>
            <label>
              <span className={LABEL}>Precio (ARS)</span>
              <input
                className={INPUT}
                inputMode="decimal"
                value={editando.precio}
                onChange={e => campo({ precio: e.target.value })}
              />
            </label>
            <label className="sm:col-span-2">
              <span className={LABEL}>Descripción (opcional)</span>
              <input
                className={INPUT}
                value={editando.descripcion}
                onChange={e => campo({ descripcion: e.target.value })}
              />
            </label>
            <label>
              <span className={LABEL}>Entradas por unidad</span>
              <input
                className={INPUT}
                inputMode="numeric"
                value={editando.entradasPorUnidad}
                onChange={e => campo({ entradasPorUnidad: e.target.value })}
              />
            </label>
            <label>
              <span className={LABEL}>Estado</span>
              <select
                className={INPUT}
                value={editando.estado}
                onChange={e => campo({ estado: e.target.value as EstadoEntrada })}
              >
                {ESTADOS_ENTRADA.map(s => (
                  <option key={s.valor} value={s.valor}>
                    {s.etiqueta}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={LABEL}>Cupo en entradas (vacío = sin tope)</span>
              <input
                className={INPUT}
                inputMode="numeric"
                value={editando.cupo}
                onChange={e => campo({ cupo: e.target.value })}
              />
            </label>
            <label>
              <span className={LABEL}>Máximo por compra (vacío = sin tope)</span>
              <input
                className={INPUT}
                inputMode="numeric"
                value={editando.maxPorCompra}
                onChange={e => campo({ maxPorCompra: e.target.value })}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-[11px] text-manso-cream/60">
            <input type="checkbox" checked={editando.activo} onChange={e => campo({ activo: e.target.checked })} />
            Visible en la web
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={guardar} disabled={ocupado === 'guardar'} className={BOTON_GUARDAR}>
              {ocupado === 'guardar' && <Loader2 size={11} className="animate-spin" />}
              Guardar
            </button>
            <button type="button" onClick={() => setEditando(null)} className={BOTON_ICONO + ' !w-auto px-3'}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {!editando && !error && (
        <button type="button" onClick={() => setEditando(vacio())} className={BOTON_AGREGAR}>
          <Plus size={12} />
          Agregar tipo
        </button>
      )}
    </section>
  );
}
