'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Download, Loader2, Mail, MessageCircle, RefreshCw, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  AREAS,
  CONFIG_VOLUNTARIOS_POR_DEFECTO,
  ESTADOS_VOLUNTARIO,
  ETIQUETA_ESTADO,
  convocatoriaAbierta,
  edadAl,
  type ConfigVoluntarios,
  type EstadoVoluntario,
} from '@/lib/festival-voluntarios';
import { FestivalVoluntariosLink } from './FestivalVoluntariosLink';
import { AYUDA, BOTON_GUARDAR, BOTON_ICONO, CARD, INPUT, LABEL, TITULO } from './festivalComun';

/**
 * Subsección "Voluntarios" del panel de Festival (/blur/voluntarios).
 *
 * Reemplaza a la Google Sheet que proponía el brief: las postulaciones llegan
 * por `/api/festival/voluntarios` a `festival_voluntarios` y acá producción las
 * filtra, les pone estado, área y turno, y las baja a CSV. Las cuatro columnas
 * del equipo del brief (Estado, Área asignada, Turno asignado, Notas) son los
 * campos editables de cada tarjeta. Lo que el brief dejó "A DEFINIR" se carga
 * arriba, en los parámetros de la convocatoria: vacío, no aparece en la página.
 */

interface Voluntario {
  id: string;
  created_at: string;
  nombre: string;
  email: string;
  whatsapp: string;
  fecha_nacimiento: string;
  instagram: string | null;
  ciudad: string;
  areas: string[];
  disponibilidad: string[];
  experiencia: boolean;
  experiencia_detalle: string | null;
  idiomas: string[];
  idiomas_otro: string | null;
  motivo: string;
  con_quien: string | null;
  como_te_enteraste: string;
  acepta_datos: boolean;
  novedades: boolean;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  idioma_pagina: string | null;
  duplicado: boolean;
  estado: EstadoVoluntario;
  area_asignada: string | null;
  turno_asignado: string | null;
  notas: string | null;
  mail_confirmacion_at: string | null;
}

const ESTILO_ESTADO: Record<EstadoVoluntario, string> = {
  nuevo: 'bg-manso-terra/20 text-manso-terra',
  contactado: 'bg-manso-cream/15 text-manso-cream',
  confirmado: 'bg-manso-olive/30 text-manso-olive',
  en_espera: 'bg-manso-cream/10 text-manso-cream/60',
  descartado: 'bg-manso-cream/5 text-manso-cream/62 line-through',
};

const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  });

/** ISO → "YYYY-MM-DDTHH:mm" en hora argentina, para el `datetime-local`. */
function aInputLocal(iso: string | null): string {
  if (!iso) return '';
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date(iso)).map(p => [p.type, p.value])
  );
  return `${partes.year}-${partes.month}-${partes.day}T${partes.hour}:${partes.minute}`;
}

/** Lo que se escribe en el `datetime-local` es hora argentina (UTC-3, sin horario de verano). */
const deInputLocal = (v: string): string | null => (v ? new Date(`${v}:00-03:00`).toISOString() : null);

const csv = (valor: unknown) => {
  const s = Array.isArray(valor) ? valor.join(' | ') : valor === null || valor === undefined ? '' : String(valor);
  return `"${s.replace(/"/g, '""')}"`;
};

export function FestivalVoluntariosAdmin() {
  const [filas, setFilas] = useState<Voluntario[]>([]);
  const [avisos, setAvisos] = useState<{ email: string }[]>([]);
  const [config, setConfig] = useState<ConfigVoluntarios>(CONFIG_VOLUNTARIOS_POR_DEFECTO);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [guardandoConfig, setGuardandoConfig] = useState(false);
  const [configGuardada, setConfigGuardada] = useState(false);

  const [filtroEstado, setFiltroEstado] = useState<EstadoVoluntario | 'todos'>('todos');
  const [filtroArea, setFiltroArea] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [abierta, setAbierta] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    const [v, a, c] = await Promise.all([
      supabase.from('festival_voluntarios').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('festival_voluntarios_aviso').select('email').order('created_at', { ascending: false }),
      supabase.from('festival_voluntarios_config').select('*').eq('id', 1).maybeSingle(),
    ]);
    // Sin la migración las tablas no existen: se dice, no se muestra un panel vacío "como si nada".
    if (v.error) setErrorCarga(v.error.message);
    setFilas((v.data as Voluntario[] | null) ?? []);
    setAvisos((a.data as { email: string }[] | null) ?? []);
    if (c.data) setConfig({ ...CONFIG_VOLUNTARIOS_POR_DEFECTO, ...(c.data as ConfigVoluntarios) });
    setCargando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const conteos = useMemo(() => {
    const c: Record<string, number> = { todos: filas.length };
    for (const e of ESTADOS_VOLUNTARIO) c[e] = filas.filter(f => f.estado === e).length;
    return c;
  }, [filas]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return filas.filter(f => {
      if (filtroEstado !== 'todos' && f.estado !== filtroEstado) return false;
      if (filtroArea && !f.areas.includes(filtroArea)) return false;
      if (!q) return true;
      return [f.nombre, f.email, f.whatsapp, f.instagram, f.ciudad, f.con_quien].some(x => x?.toLowerCase().includes(q));
    });
  }, [filas, filtroEstado, filtroArea, busqueda]);

  const guardarConfig = async () => {
    setGuardandoConfig(true);
    const { error } = await supabase
      .from('festival_voluntarios_config')
      .update({ ...config, updated_at: new Date().toISOString() })
      .eq('id', 1);
    setGuardandoConfig(false);
    if (error) {
      alert(`No se pudo guardar: ${error.message}`);
      return;
    }
    setConfigGuardada(true);
    setTimeout(() => setConfigGuardada(false), 2500);
  };

  const actualizar = async (id: string, campos: Partial<Voluntario>) => {
    const { error } = await supabase.from('festival_voluntarios').update(campos).eq('id', id);
    if (error) {
      alert(`No se pudo guardar: ${error.message}`);
      return false;
    }
    setFilas(prev => prev.map(f => (f.id === id ? { ...f, ...campos } : f)));
    return true;
  };

  const borrar = async (f: Voluntario) => {
    if (!confirm(`¿Borrar la postulación de ${f.nombre}? Se pierde del todo (es lo que pide quien ejerce su derecho a que borremos sus datos).`)) return;
    const { error } = await supabase.from('festival_voluntarios').delete().eq('id', f.id);
    if (error) {
      alert(`No se pudo borrar: ${error.message}`);
      return;
    }
    setFilas(prev => prev.filter(x => x.id !== f.id));
  };

  const exportar = () => {
    const columnas: [string, (f: Voluntario) => unknown][] = [
      ['Fecha de envío', f => f.created_at],
      ['Estado', f => ETIQUETA_ESTADO[f.estado]],
      ['Área asignada', f => f.area_asignada],
      ['Turno asignado', f => f.turno_asignado],
      ['Notas', f => f.notas],
      ['Nombre y apellido', f => f.nombre],
      ['Email', f => f.email],
      ['WhatsApp', f => f.whatsapp],
      ['Fecha de nacimiento', f => f.fecha_nacimiento],
      ['Instagram', f => f.instagram],
      ['Barrio / ciudad', f => f.ciudad],
      ['Áreas de interés', f => f.areas],
      ['Disponibilidad', f => f.disponibilidad],
      ['Experiencia', f => (f.experiencia ? 'Sí' : 'No')],
      ['Experiencia (detalle)', f => f.experiencia_detalle],
      ['Idiomas', f => [...f.idiomas, f.idiomas_otro ? `Otro: ${f.idiomas_otro}` : ''].filter(Boolean)],
      ['Por qué quiere ser parte', f => f.motivo],
      ['Viene con', f => f.con_quien],
      ['Cómo se enteró', f => f.como_te_enteraste],
      ['Quiere novedades', f => (f.novedades ? 'Sí' : 'No')],
      ['utm_source', f => f.utm_source],
      ['utm_medium', f => f.utm_medium],
      ['utm_campaign', f => f.utm_campaign],
      ['Idioma de la página', f => f.idioma_pagina],
      ['Duplicado', f => (f.duplicado ? 'Sí' : '')],
    ];
    const cuerpo = [columnas.map(([n]) => csv(n)).join(',')]
      .concat(visibles.map(f => columnas.map(([, fn]) => csv(fn(f))).join(',')))
      .join('\r\n');
    // BOM para que Excel lea bien las tildes.
    const url = URL.createObjectURL(new Blob([`\uFEFF${cuerpo}`], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `blur-voluntarios-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const texto = (campo: 'turnos' | 'montaje' | 'desmontaje' | 'traslado' | 'induccion', etiqueta: string, ayuda: string) => (
    <div>
      <label className={LABEL}>{etiqueta}</label>
      <input
        className={INPUT}
        value={config[campo] ?? ''}
        onChange={e => setConfig(c => ({ ...c, [campo]: e.target.value || null }))}
      />
      <p className={AYUDA}>{ayuda}</p>
    </div>
  );

  const abiertaHoy = convocatoriaAbierta(config);

  return (
    <section className="space-y-4" id="voluntarios">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className={TITULO}>Voluntarios</h3>
          <p className={AYUDA}>
            Lo que se completa en el formulario privado llega acá. {conteos.nuevo ?? 0} sin contactar · {filas.length} en total.
          </p>
        </div>
        <button type="button" onClick={cargar} className={BOTON_ICONO} aria-label="Actualizar" title="Actualizar">
          {cargando ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        </button>
      </div>

      <FestivalVoluntariosLink />

      {errorCarga && (
        <p className="text-[13px] text-manso-terra bg-manso-terra/10 border border-manso-terra/30 rounded-xl p-3">
          No se pudieron leer las postulaciones: {errorCarga}. ¿Corrió <code>supabase/migration_festival_voluntarios.sql</code>?
        </p>
      )}

      {/* ── Parámetros de la convocatoria ── */}
      <details className={CARD}>
        <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
          <span className={TITULO}>
            Convocatoria · {abiertaHoy ? 'abierta' : 'cerrada'}
          </span>
          <ChevronDown size={14} className="text-manso-cream/62" />
        </summary>

        <div className="space-y-4 pt-2">
          <label className="flex items-start justify-between gap-4 cursor-pointer">
            <span>
              <span className={`${LABEL} mb-0`}>Recibir postulaciones</span>
              <span className={AYUDA}>Apagado, el formulario se reemplaza por &ldquo;Convocatoria cerrada&rdquo; con un campo de mail para la próxima edición.</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={config.abierta}
              onChange={e => setConfig(c => ({ ...c, abierta: e.target.checked }))}
              className="mt-1 w-9 h-5 shrink-0 appearance-none rounded-full bg-manso-cream/15 checked:bg-manso-olive relative cursor-pointer transition-colors before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:w-4 before:h-4 before:rounded-full before:bg-manso-cream before:transition-transform checked:before:translate-x-4"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Fecha de cierre (hora de Argentina)</label>
              <input
                type="datetime-local"
                className={INPUT}
                value={aInputLocal(config.cierre)}
                onChange={e => setConfig(c => ({ ...c, cierre: deInputLocal(e.target.value) }))}
              />
              <p className={AYUDA}>Vacía, no cierra sola. Al pasar esa fecha, el formulario se cierra.</p>
            </div>
            <div>
              <label className={LABEL}>Edad mínima</label>
              <input
                type="number"
                min={0}
                max={99}
                className={INPUT}
                value={config.edad_minima}
                onChange={e => setConfig(c => ({ ...c, edad_minima: Math.max(0, Math.min(99, Number(e.target.value) || 0)) }))}
              />
              <p className={AYUDA}>Se cuenta al 12/12/2026, no a hoy.</p>
            </div>
          </div>

          <p className={AYUDA}>
            Lo siguiente era &ldquo;A DEFINIR&rdquo; en el brief. <b>Lo que dejes vacío no aparece en la página</b>, así no queda con huecos.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {texto('turnos', 'Turnos del sábado', 'Ej: 6 horas. Sale como "Turnos de 6 horas."')}
            {texto('induccion', 'Inducción', 'Fecha y formato. Si lo cargás, también se pide como requisito.')}
            {texto('montaje', 'Montaje', 'Ej: jueves 10 y viernes 11/12, de 10 a 18 h.')}
            {texto('desmontaje', 'Desmontaje', 'Ej: domingo 13/12, desde las 10 h.')}
          </div>
          {texto('traslado', 'Cómo llegar / lancha', 'Quién cubre la lancha desde Tigre. Si lo cargás, se suma a "Fecha y compromiso" y a las preguntas frecuentes.')}

          <div>
            <label className={LABEL}>Opciones de disponibilidad (una por línea)</label>
            <textarea
              rows={5}
              className={INPUT}
              value={config.disponibilidad.join('\n')}
              onChange={e => setConfig(c => ({ ...c, disponibilidad: e.target.value.split('\n').map(l => l.trim()).filter(Boolean) }))}
            />
            <p className={AYUDA}>
              Son las casillas del formulario. Poné las fechas exactas de montaje. Si cambiás una, las postulaciones ya recibidas conservan el texto con que se anotaron.
            </p>
          </div>

          <button
            type="button"
            onClick={guardarConfig}
            disabled={guardandoConfig || config.disponibilidad.length === 0}
            className={BOTON_GUARDAR}
          >
            {guardandoConfig ? <Loader2 size={12} className="animate-spin" /> : configGuardada ? <Check size={12} /> : <Save size={12} />}
            {configGuardada ? 'Guardado' : 'Guardar convocatoria'}
          </button>
        </div>
      </details>

      {/* ── Filtros ── */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {(['todos', ...ESTADOS_VOLUNTARIO] as const).map(e => (
            <button
              key={e}
              type="button"
              onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-black uppercase tracking-widest transition-colors ${
                filtroEstado === e ? 'bg-manso-cream text-manso-black' : 'bg-manso-cream/5 text-manso-cream/60 hover:bg-manso-cream/10'
              }`}
            >
              {e === 'todos' ? 'Todos' : ETIQUETA_ESTADO[e]} · {conteos[e] ?? 0}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className={INPUT}
            placeholder="Buscar por nombre, mail, WhatsApp, Instagram…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <select className={`${INPUT} sm:max-w-[260px]`} value={filtroArea} onChange={e => setFiltroArea(e.target.value)}>
            <option value="">Todas las áreas</option>
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button type="button" onClick={exportar} disabled={visibles.length === 0} className={`${BOTON_GUARDAR} justify-center shrink-0`}>
            <Download size={12} />
            CSV ({visibles.length})
          </button>
        </div>
      </div>

      {/* ── Lista ── */}
      {cargando && filas.length === 0 ? (
        <p className={AYUDA}>Cargando…</p>
      ) : visibles.length === 0 ? (
        <p className={`${AYUDA} py-6 text-center`}>
          {filas.length === 0 ? 'Todavía no hay postulaciones.' : 'Ninguna postulación coincide con el filtro.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {visibles.map(f => (
            <Tarjeta
              key={f.id}
              f={f}
              abierta={abierta === f.id}
              alternar={() => setAbierta(a => (a === f.id ? null : f.id))}
              actualizar={actualizar}
              borrar={() => borrar(f)}
            />
          ))}
        </ul>
      )}

      {/* ── Próxima edición ── */}
      {avisos.length > 0 && (
        <div className={CARD}>
          <div className="flex items-center justify-between gap-3">
            <h4 className={TITULO}>Quieren que les avisemos de la próxima edición · {avisos.length}</h4>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(avisos.map(a => a.email).join(', '))}
              className={BOTON_GUARDAR}
            >
              Copiar mails
            </button>
          </div>
          <p className={AYUDA}>Los que dejaron el mail cuando la convocatoria estaba cerrada.</p>
        </div>
      )}
    </section>
  );
}

function Tarjeta({
  f,
  abierta,
  alternar,
  actualizar,
  borrar,
}: {
  f: Voluntario;
  abierta: boolean;
  alternar: () => void;
  actualizar: (id: string, campos: Partial<Voluntario>) => Promise<boolean>;
  borrar: () => void;
}) {
  // Borradores de los campos de texto: se guardan con el botón, no en cada tecla.
  const [area, setArea] = useState(f.area_asignada ?? '');
  const [turno, setTurno] = useState(f.turno_asignado ?? '');
  const [notas, setNotas] = useState(f.notas ?? '');
  const [guardando, setGuardando] = useState(false);

  const sucio =
    area !== (f.area_asignada ?? '') || turno !== (f.turno_asignado ?? '') || notas !== (f.notas ?? '');

  const guardar = async () => {
    setGuardando(true);
    await actualizar(f.id, {
      area_asignada: area.trim() || null,
      turno_asignado: turno.trim() || null,
      notas: notas.trim() || null,
    });
    setGuardando(false);
  };

  const edad = edadAl(f.fecha_nacimiento);
  const telefono = f.whatsapp.replace(/\D/g, '');
  const dato = (etiqueta: string, valor: React.ReactNode) =>
    valor ? (
      <div>
        <dt className="text-[12px] font-black uppercase tracking-widest text-manso-cream/62">{etiqueta}</dt>
        <dd className="text-[13px] text-manso-cream/90 whitespace-pre-line break-words">{valor}</dd>
      </div>
    ) : null;

  return (
    <li className="bg-manso-cream/5 border border-manso-cream/10 rounded-2xl overflow-hidden">
      <button type="button" onClick={alternar} aria-expanded={abierta} className="w-full text-left p-4 flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-black text-manso-cream">{f.nombre}</span>
            <span className={`px-2 py-0.5 rounded-md text-[12px] font-black uppercase tracking-widest ${ESTILO_ESTADO[f.estado]}`}>
              {ETIQUETA_ESTADO[f.estado]}
            </span>
            {f.duplicado && (
              <span className="px-2 py-0.5 rounded-md text-[12px] font-black uppercase tracking-widest bg-manso-cream/10 text-manso-cream/70" title="Ese mail ya se había anotado antes">
                Duplicado
              </span>
            )}
            {!f.mail_confirmacion_at && (
              <span className="px-2 py-0.5 rounded-md text-[12px] font-black uppercase tracking-widest bg-manso-terra/15 text-manso-terra" title="No salió el mail de confirmación a la persona">
                Sin mail
              </span>
            )}
          </div>
          <p className="text-[13px] text-manso-cream/60 truncate">{f.areas.join(' · ')}</p>
          <p className="text-[13px] text-manso-cream/62">
            {fechaHora(f.created_at)}{f.ciudad ? ` · ${f.ciudad}` : ''}
            {edad !== null && ` · ${edad} años`}
            {f.idiomas.length > 0 && ` · ${f.idiomas.join(', ')}`}
          </p>
        </div>
        <ChevronDown size={16} className={`mt-1 shrink-0 text-manso-cream/62 transition-transform ${abierta ? 'rotate-180' : ''}`} />
      </button>

      {abierta && (
        <div className="border-t border-manso-cream/10 p-4 space-y-5">
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://wa.me/${telefono}`}
              target="_blank"
              rel="noopener noreferrer"
              className={BOTON_GUARDAR}
            >
              <MessageCircle size={12} />
              {f.whatsapp}
            </a>
            <a href={`mailto:${f.email}`} className={BOTON_GUARDAR}>
              <Mail size={12} />
              {f.email}
            </a>
            {f.instagram && (
              <a href={`https://instagram.com/${f.instagram}`} target="_blank" rel="noopener noreferrer" className={BOTON_GUARDAR}>
                @{f.instagram}
              </a>
            )}
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            {dato('Disponibilidad', f.disponibilidad.join('\n'))}
            {dato('Experiencia', f.experiencia ? f.experiencia_detalle || 'Sí' : 'No')}
            {dato('Idiomas', [...f.idiomas, f.idiomas_otro ? `Otro: ${f.idiomas_otro}` : ''].filter(Boolean).join(', '))}
            {dato('Viene con', f.con_quien)}
            {dato('Cómo se enteró', f.como_te_enteraste)}
            {dato('Nació', f.fecha_nacimiento)}
            {dato('Novedades', f.novedades ? 'Quiere recibir novedades' : null)}
            {dato(
              'Llegó desde',
              [f.utm_source, f.utm_medium, f.utm_campaign].filter(Boolean).join(' / ') || null
            )}
          </dl>
          {dato('Por qué quiere ser parte', f.motivo)}

          {/* Las cuatro columnas del equipo del brief. */}
          <div className="border-t border-manso-cream/10 pt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={LABEL}>Estado</label>
                <select
                  className={INPUT}
                  value={f.estado}
                  onChange={e => actualizar(f.id, { estado: e.target.value as EstadoVoluntario })}
                >
                  {ESTADOS_VOLUNTARIO.map(e => <option key={e} value={e}>{ETIQUETA_ESTADO[e]}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Área asignada</label>
                <input className={INPUT} list="areas-voluntarios" value={area} onChange={e => setArea(e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Turno asignado</label>
                <input className={INPUT} value={turno} onChange={e => setTurno(e.target.value)} />
              </div>
            </div>
            <div>
              <label className={LABEL}>Notas</label>
              <textarea rows={2} className={INPUT} value={notas} onChange={e => setNotas(e.target.value)} />
              <p className={AYUDA}>Solo las ve el equipo.</p>
            </div>
            <datalist id="areas-voluntarios">
              {AREAS.map(a => <option key={a} value={a} />)}
            </datalist>
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={guardar} disabled={!sucio || guardando} className={BOTON_GUARDAR}>
                {guardando ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Guardar
              </button>
              <button type="button" onClick={borrar} className={BOTON_ICONO} aria-label={`Borrar a ${f.nombre}`} title="Borrar">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
