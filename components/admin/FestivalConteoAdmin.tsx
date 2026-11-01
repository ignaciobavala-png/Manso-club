'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Loader2, RefreshCw, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  CONTEO_CONFIG_POR_DEFECTO,
  ConteoClick,
  ConteoConfig,
  ConteoDia,
  ConteoPantalla,
  ConteoResumen,
  nombrePantalla,
} from '@/lib/types/festival-conteo';
import { AYUDA, BOTON_GUARDAR, CARD, INPUT, LABEL, TITULO } from './festivalComun';

/**
 * Subsección "Conteo de visitas" del panel de Festival: parámetros de qué y
 * cómo se mide (guardan en `festival_conteo_config`) y los reportes por
 * pantalla, por click y por día. Los números salen de funciones SQL que
 * solo contestan a un admin (ver migration_festival_conteo.sql).
 */

type Rango = 'hoy' | '7d' | '30d' | '90d' | 'todo' | 'custom';
type Orden = 'vistas' | 'visitantes' | 'segundos_prom' | 'segundos_mediana' | 'segundos_total' | 'clicks';

const RANGOS: { id: Rango; texto: string }[] = [
  { id: 'hoy', texto: 'Hoy' },
  { id: '7d', texto: '7 días' },
  { id: '30d', texto: '30 días' },
  { id: '90d', texto: '90 días' },
  { id: 'todo', texto: 'Todo' },
  { id: 'custom', texto: 'Fechas' },
];

const DISPOSITIVOS = [
  { id: '', texto: 'Todos los dispositivos' },
  { id: 'movil', texto: 'Celular' },
  { id: 'tablet', texto: 'Tablet' },
  { id: 'escritorio', texto: 'Escritorio' },
];

const COLUMNAS: { id: Orden; texto: string }[] = [
  { id: 'vistas', texto: 'Vistas' },
  { id: 'visitantes', texto: 'Personas' },
  { id: 'segundos_prom', texto: 'Tiempo prom.' },
  { id: 'segundos_mediana', texto: 'Mediana' },
  { id: 'segundos_total', texto: 'Tiempo total' },
  { id: 'clicks', texto: 'Clicks' },
];

/** "1 h 05 m", "3 m 12 s", "45 s". */
function duracion(seg: number | null | undefined): string {
  if (seg === null || seg === undefined) return '—';
  const s = Math.round(seg);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} m ${String(s % 60).padStart(2, '0')} s`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} m`;
}

const numero = (n: number | null | undefined) => (n === null || n === undefined ? '—' : n.toLocaleString('es-AR'));

/** Medianoche de hoy en hora argentina (UTC-3, sin horario de verano), como Date. */
function inicioDelDia(offsetDias = 0): Date {
  const ahora = new Date(Date.now() - 3 * 3600_000);
  const base = Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate() + offsetDias);
  return new Date(base + 3 * 3600_000);
}

function ventana(rango: Rango, desde: string, hasta: string): { desde: Date; hasta: Date } {
  const manana = inicioDelDia(1);
  switch (rango) {
    case 'hoy':
      return { desde: inicioDelDia(0), hasta: manana };
    case '7d':
      return { desde: inicioDelDia(-6), hasta: manana };
    case '30d':
      return { desde: inicioDelDia(-29), hasta: manana };
    case '90d':
      return { desde: inicioDelDia(-89), hasta: manana };
    case 'custom': {
      const d = desde ? new Date(`${desde}T00:00:00-03:00`) : new Date(0);
      const h = hasta ? new Date(`${hasta}T00:00:00-03:00`) : inicioDelDia(0);
      return { desde: d, hasta: new Date(h.getTime() + 86400_000) };
    }
    default:
      return { desde: new Date(0), hasta: manana };
  }
}

const Interruptor = ({
  titulo,
  ayuda,
  valor,
  onChange,
}: {
  titulo: string;
  ayuda: string;
  valor: boolean;
  onChange: (v: boolean) => void;
}) => (
  <label className="flex items-start justify-between gap-4 py-3 cursor-pointer">
    <span className="space-y-0.5">
      <span className="block text-[11px] font-black uppercase tracking-widest text-manso-cream">{titulo}</span>
      <span className="block text-[11px] text-manso-cream/40 leading-relaxed">{ayuda}</span>
    </span>
    <input
      type="checkbox"
      checked={valor}
      onChange={e => onChange(e.target.checked)}
      className="mt-1 w-9 h-5 shrink-0 appearance-none rounded-full bg-manso-cream/15 checked:bg-manso-olive relative cursor-pointer transition-colors before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:w-4 before:h-4 before:rounded-full before:bg-manso-cream before:transition-transform checked:before:translate-x-4"
    />
  </label>
);

const Numero = ({
  titulo,
  ayuda,
  valor,
  min,
  max,
  unidad,
  onChange,
}: {
  titulo: string;
  ayuda: string;
  valor: number;
  min: number;
  max: number;
  unidad: string;
  onChange: (v: number) => void;
}) => (
  <div className="py-3 flex items-start justify-between gap-4">
    <div className="space-y-0.5">
      <p className="text-[11px] font-black uppercase tracking-widest text-manso-cream">{titulo}</p>
      <p className="text-[11px] text-manso-cream/40 leading-relaxed">{ayuda}</p>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <input
        type="number"
        min={min}
        max={max}
        value={valor}
        onChange={e => onChange(Math.min(max, Math.max(min, Math.trunc(Number(e.target.value) || 0))))}
        className={`${INPUT} !w-24 !py-2 text-right`}
      />
      <span className="text-[10px] text-manso-cream/40 w-10">{unidad}</span>
    </div>
  </div>
);

export function FestivalConteoAdmin() {
  const [config, setConfig] = useState<ConteoConfig>(CONTEO_CONFIG_POR_DEFECTO);
  const [rutasTexto, setRutasTexto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [avisoConfig, setAvisoConfig] = useState<string | null>(null);

  const [rango, setRango] = useState<Rango>('7d');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [dispositivo, setDispositivo] = useState('');
  const [pantallaElegida, setPantallaElegida] = useState<string | null>(null);

  const [resumen, setResumen] = useState<ConteoResumen | null>(null);
  const [pantallas, setPantallas] = useState<ConteoPantalla[]>([]);
  const [clicks, setClicks] = useState<ConteoClick[]>([]);
  const [dias, setDias] = useState<ConteoDia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orden, setOrden] = useState<Orden>('vistas');

  // ── Parámetros ─────────────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from('festival_conteo_config')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        const c = { ...CONTEO_CONFIG_POR_DEFECTO, ...(data ?? {}) } as ConteoConfig;
        setConfig(c);
        setRutasTexto(c.rutas_excluidas.join('\n'));
      });
  }, []);

  const editar = (campos: Partial<ConteoConfig>) => setConfig(c => ({ ...c, ...campos }));

  const guardarConfig = async () => {
    setGuardando(true);
    setAvisoConfig(null);
    const rutas = rutasTexto
      .split('\n')
      .map(r => r.trim())
      .filter(Boolean)
      .map(r => (r.startsWith('/') ? r : `/${r}`));
    const { error: e } = await supabase
      .from('festival_conteo_config')
      .upsert({ id: 1, ...config, rutas_excluidas: rutas, updated_at: new Date().toISOString() });
    setGuardando(false);
    if (e) return setAvisoConfig(e.message);
    editar({ rutas_excluidas: rutas });
    setAvisoConfig('Guardado. Los visitantes toman los cambios al abrir la próxima pantalla.');
  };

  // ── Reportes ───────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    const { desde: d, hasta: h } = ventana(rango, desde, hasta);
    const base = { p_desde: d.toISOString(), p_hasta: h.toISOString(), p_dispositivo: dispositivo || null };

    const [r, p, c, di] = await Promise.all([
      supabase.rpc('festival_conteo_resumen', base),
      supabase.rpc('festival_conteo_pantallas', base),
      supabase.rpc('festival_conteo_clicks', { ...base, p_path: pantallaElegida }),
      supabase.rpc('festival_conteo_dias', base),
    ]);
    const falla = r.error ?? p.error ?? c.error ?? di.error;
    if (falla) setError(falla.message);

    setResumen(((r.data as ConteoResumen[] | null) ?? [])[0] ?? null);
    setPantallas((p.data as ConteoPantalla[] | null) ?? []);
    setClicks((c.data as ConteoClick[] | null) ?? []);
    setDias((di.data as ConteoDia[] | null) ?? []);
    setCargando(false);
  }, [rango, desde, hasta, dispositivo, pantallaElegida]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const ordenadas = useMemo(
    () => [...pantallas].sort((a, b) => (Number(b[orden]) || 0) - (Number(a[orden]) || 0)),
    [pantallas, orden]
  );
  const maxDia = Math.max(1, ...dias.map(d => d.vistas));

  const exportarCsv = () => {
    const filas = [
      ['pantalla', 'ruta', 'vistas', 'personas', 'segundos_promedio', 'segundos_mediana', 'segundos_total', 'clicks'],
      ...ordenadas.map(p => [
        nombrePantalla(p.path),
        p.path,
        p.vistas,
        p.visitantes,
        p.segundos_prom ?? '',
        p.segundos_mediana ?? '',
        p.segundos_total,
        p.clicks,
      ]),
    ];
    const csv = filas.map(f => f.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    a.download = `blur-conteo-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const borrarAnteriores = async () => {
    const dias = Number(prompt('¿Borrar los datos de hace más de cuántos días? (0 = borrar todo)', '90'));
    if (!Number.isFinite(dias) || dias < 0) return;
    const corte = dias === 0 ? new Date(Date.now() + 86400_000) : new Date(Date.now() - dias * 86400_000);
    const que = dias === 0 ? 'TODO el conteo' : `el conteo anterior al ${corte.toLocaleDateString('es-AR')}`;
    if (!confirm(`¿Borrar ${que}? No se puede deshacer.`)) return;
    const { error: e } = await supabase.from('festival_visitas').delete().lt('creada', corte.toISOString());
    if (e) return alert(e.message);
    cargar();
  };

  const tarjeta = (titulo: string, valor: string, nota?: string) => (
    <div className="bg-manso-cream/5 border border-manso-cream/10 rounded-xl p-3">
      <p className="text-[9px] font-black uppercase tracking-widest text-manso-cream/40">{titulo}</p>
      <p className="text-xl font-black text-manso-cream mt-1">{valor}</p>
      {nota && <p className="text-[10px] text-manso-cream/40 mt-0.5">{nota}</p>}
    </div>
  );

  return (
    <section id="conteo-visitas" className={`${CARD} !space-y-6`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className={TITULO}>Conteo de visitas</h3>
          <p className={AYUDA}>
            Cuántas veces se ve cada pantalla de /blur, cuánto se queda la gente y en qué toca. Sin cookies, sin IP
            ni datos personales; no cuenta borradores ni (si lo dejás prendido) a los admins.
          </p>
        </div>
        <button
          type="button"
          onClick={cargar}
          disabled={cargando}
          title="Actualizar"
          className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-manso-cream/40 hover:text-manso-cream hover:bg-manso-cream/10 transition-colors"
        >
          {cargando ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        </button>
      </div>

      {/* ── Filtros ───────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {RANGOS.map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRango(r.id)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors ${
                rango === r.id
                  ? 'bg-manso-terra/25 text-manso-terra'
                  : 'bg-manso-cream/5 text-manso-cream/50 hover:text-manso-cream'
              }`}
            >
              {r.texto}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {rango === 'custom' && (
            <>
              <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className={`${INPUT} !w-auto !py-2`} />
              <span className="text-manso-cream/30 text-xs">a</span>
              <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className={`${INPUT} !w-auto !py-2`} />
            </>
          )}
          <select value={dispositivo} onChange={e => setDispositivo(e.target.value)} className={`${INPUT} !w-auto !py-2`}>
            {DISPOSITIVOS.map(d => (
              <option key={d.id} value={d.id} className="bg-manso-black">
                {d.texto}
              </option>
            ))}
          </select>
          {pantallaElegida && (
            <button
              type="button"
              onClick={() => setPantallaElegida(null)}
              className="px-3 py-1.5 rounded-lg bg-manso-olive/20 text-manso-olive text-[9px] font-black uppercase tracking-widest"
            >
              Clicks de: {nombrePantalla(pantallaElegida)} ✕
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-manso-terra leading-relaxed">
          No se pudieron leer los datos: {error}. ¿Corriste supabase/migration_festival_conteo.sql?
        </p>
      )}

      {/* ── Totales ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tarjeta('Vistas', numero(resumen?.vistas), `${numero(resumen?.sesiones)} sesiones`)}
        {tarjeta('Personas', numero(resumen?.visitantes), 'navegadores distintos')}
        {tarjeta('Tiempo por pantalla', duracion(resumen?.segundos_prom), 'promedio')}
        {tarjeta('Clicks', numero(resumen?.clicks), resumen?.vistas ? `${(resumen.clicks / resumen.vistas).toFixed(1)} por vista` : undefined)}
      </div>

      {/* ── Por día ───────────────────────────────────────────────── */}
      {dias.length > 0 && (
        <div className="space-y-2">
          <p className={LABEL}>Por día (vistas)</p>
          <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
            {dias.map(d => (
              <div key={d.dia} className="flex items-center gap-3 text-[11px]">
                <span className="w-20 shrink-0 text-manso-cream/50 tabular-nums">
                  {new Date(`${d.dia}T12:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                </span>
                <div className="flex-1 h-4 bg-manso-cream/5 rounded">
                  <div className="h-full bg-manso-terra/60 rounded" style={{ width: `${(d.vistas / maxDia) * 100}%` }} />
                </div>
                <span className="w-28 shrink-0 text-right text-manso-cream/70 tabular-nums">
                  {numero(d.vistas)} · {numero(d.visitantes)} pers.
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Por pantalla ──────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className={`${LABEL} !mb-0`}>Por pantalla</p>
          <button
            type="button"
            onClick={exportarCsv}
            disabled={!pantallas.length}
            className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-manso-cream/50 hover:text-manso-cream disabled:opacity-30"
          >
            <Download size={11} />
            CSV
          </button>
        </div>
        {pantallas.length === 0 ? (
          <p className="text-[11px] text-manso-cream/40 py-4">
            {cargando ? 'Cargando…' : 'Todavía no hay visitas en este período.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-manso-cream">
              <thead>
                <tr className="text-left text-[9px] uppercase tracking-widest text-manso-cream/40">
                  <th className="py-2 pr-3 font-black">Pantalla</th>
                  {COLUMNAS.map(c => (
                    <th key={c.id} className="py-2 px-2 font-black text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setOrden(c.id)}
                        className={orden === c.id ? 'text-manso-terra' : 'hover:text-manso-cream'}
                      >
                        {c.texto}
                        {orden === c.id ? ' ↓' : ''}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-manso-cream/10">
                {ordenadas.map(p => (
                  <tr
                    key={p.path}
                    onClick={() => setPantallaElegida(pantallaElegida === p.path ? null : p.path)}
                    title="Ver solo los clicks de esta pantalla"
                    className={`cursor-pointer hover:bg-manso-cream/5 ${pantallaElegida === p.path ? 'bg-manso-olive/10' : ''}`}
                  >
                    <td className="py-2 pr-3">
                      <span className="font-black">{nombrePantalla(p.path)}</span>
                      <span className="block text-[10px] text-manso-cream/30">{p.path}</span>
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">{numero(p.vistas)}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{numero(p.visitantes)}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{duracion(p.segundos_prom)}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{duracion(p.segundos_mediana)}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{duracion(p.segundos_total)}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{numero(p.clicks)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className={AYUDA}>
          La mediana pesa menos que el promedio los casos extremos (alguien que dejó la pestaña abierta). Tocá una
          fila para ver solo sus clicks.
        </p>
      </div>

      {/* ── Clicks ────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <p className={LABEL}>
          Dónde tocan{pantallaElegida ? ` · ${nombrePantalla(pantallaElegida)}` : ''}
        </p>
        {clicks.length === 0 ? (
          <p className="text-[11px] text-manso-cream/40 py-2">
            {config.contar_clicks ? 'Sin clicks registrados en este período.' : 'El conteo de clicks está apagado.'}
          </p>
        ) : (
          <ul className="divide-y divide-manso-cream/10 text-[11px] max-h-72 overflow-y-auto pr-1">
            {clicks.map(c => (
              <li key={`${c.path}|${c.elemento}`} className="py-1.5 flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="text-manso-cream">{c.elemento}</span>
                  {!pantallaElegida && (
                    <span className="ml-2 text-[10px] text-manso-cream/30">{nombrePantalla(c.path)}</span>
                  )}
                </span>
                <span className="font-black tabular-nums shrink-0">{numero(c.clicks)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className={AYUDA}>
          Los botones y links salen con su texto. Para ponerle un nombre propio a uno, agregale{' '}
          <code className="text-manso-cream/60">data-conteo=&quot;nombre&quot;</code> en el código.
        </p>
      </div>

      {/* ── Parámetros ────────────────────────────────────────────── */}
      <div className="space-y-2 border-t border-manso-cream/10 pt-6">
        <p className={LABEL}>Parámetros</p>
        <div className="divide-y divide-manso-cream/10">
          <Interruptor
            titulo="Conteo activo"
            ayuda="Apagado, /blur no mide nada. Lo ya guardado se conserva."
            valor={config.activo}
            onChange={activo => editar({ activo })}
          />
          <Interruptor
            titulo="Contar clicks"
            ayuda="Guarda cuántas veces tocan y en qué (texto del botón o link, nunca lo que escriben)."
            valor={config.contar_clicks}
            onChange={contar_clicks => editar({ contar_clicks })}
          />
          <Interruptor
            titulo="Contar tiempo"
            ayuda="Mide cuánto se queda cada persona en cada pantalla."
            valor={config.contar_tiempo}
            onChange={contar_tiempo => editar({ contar_tiempo })}
          />
          <Interruptor
            titulo="Tiempo solo con la pestaña a la vista"
            ayuda="Si la persona cambia de pestaña o minimiza, el reloj se frena."
            valor={config.solo_pestana_visible}
            onChange={solo_pestana_visible => editar({ solo_pestana_visible })}
          />
          <Interruptor
            titulo="No contar a los admins"
            ayuda="Si estás logueado como admin mientras mirás /blur, esas visitas no suman."
            valor={config.excluir_admin}
            onChange={excluir_admin => editar({ excluir_admin })}
          />
          <Numero
            titulo="Cortar por inactividad"
            ayuda="Tras tantos segundos sin mover el mouse, tocar ni scrollear, el reloj se frena. 0 = no cortar."
            valor={config.inactividad_seg}
            min={0}
            max={3600}
            unidad="seg"
            onChange={inactividad_seg => editar({ inactividad_seg })}
          />
          <Numero
            titulo="Tope de tiempo por vista"
            ayuda="Ninguna pantalla cuenta más que esto, pase lo que pase."
            valor={config.tiempo_max_seg}
            min={10}
            max={86400}
            unidad="seg"
            onChange={tiempo_max_seg => editar({ tiempo_max_seg })}
          />
          <Numero
            titulo="Frecuencia de envío"
            ayuda="Cada cuánto manda lo que lleva mientras la pantalla sigue abierta. Más seguido = menos se pierde si cierran de golpe, pero más pedidos."
            valor={config.heartbeat_seg}
            min={5}
            max={300}
            unidad="seg"
            onChange={heartbeat_seg => editar({ heartbeat_seg })}
          />
          <Numero
            titulo="Clicks con detalle por vista"
            ayuda="Cuántos clicks de cada vista se guardan uno por uno. El total siempre cuenta todos."
            valor={config.clicks_max_por_vista}
            min={0}
            max={500}
            unidad="clicks"
            onChange={clicks_max_por_vista => editar({ clicks_max_por_vista })}
          />
          <Numero
            titulo="Guardar los datos"
            ayuda="Después de tantos días se borran solos (corre cada 10 min junto con la conciliación). 0 = para siempre."
            valor={config.retencion_dias}
            min={0}
            max={3650}
            unidad="días"
            onChange={retencion_dias => editar({ retencion_dias })}
          />
          <div className="py-3 space-y-2">
            <p className="text-[11px] font-black uppercase tracking-widest text-manso-cream">Pantallas que no se miden</p>
            <p className="text-[11px] text-manso-cream/40 leading-relaxed">
              Una ruta por renglón; vale ella y todo lo que cuelga. Ej: <code>/blur/info</code>. Por defecto se
              miden todas; las de compra se agrupan en una sola (<code>/blur/compra/:id</code>) para no guardar ids de
              órdenes.
            </p>
            <textarea
              value={rutasTexto}
              onChange={e => setRutasTexto(e.target.value)}
              rows={3}
              placeholder="/blur/compra"
              className={`${INPUT} font-mono text-xs`}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button type="button" onClick={guardarConfig} disabled={guardando} className={BOTON_GUARDAR}>
            {guardando ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Guardar parámetros
          </button>
          <button
            type="button"
            onClick={borrarAnteriores}
            className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-manso-cream/40 hover:text-manso-terra transition-colors"
          >
            <Trash2 size={11} />
            Borrar datos…
          </button>
          {avisoConfig && <span className="text-[11px] text-manso-cream/60">{avisoConfig}</span>}
        </div>
      </div>
    </section>
  );
}
