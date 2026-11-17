'use client';

import { useState } from 'react';
import { AREAS, PRIORIDADES, type Area, type OrgTarea, type Prioridad } from '@/lib/org-tipos';

const COLOR_AREA: Record<Area, string> = {
  Diseño: '#2a7fd0',
  Producción: '#b53fbd',
  Técnica: '#1f9f8a',
  Comunicación: '#c23d4b',
  Operaciones: '#a39f1f',
};

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error('fallo');
  return res.json();
}

const alternar = <T,>(set: Set<T>, v: T) => {
  const n = new Set(set);
  if (n.has(v)) n.delete(v);
  else n.add(v);
  return n;
};

/**
 * Plan de tareas por zona (el HTML "Plan de Tareas por Zona" de la
 * organización). Se filtra por zona, área y prioridad, o se busca por texto. Cada
 * tarea se tilda como hecha, se edita con un click y cambia de prioridad
 * tocando su etiqueta. Guarda al instante (optimista).
 */
export function OrgTareas({ tareasIniciales, onAviso }: { tareasIniciales: OrgTarea[]; onAviso: (m: string) => void }) {
  const [tareas, setTareas] = useState(tareasIniciales);
  const [zonas, setZonas] = useState<Set<string>>(new Set());
  const [areas, setAreas] = useState<Set<Area>>(new Set());
  const [prios, setPrios] = useState<Set<Prioridad>>(new Set());
  const [q, setQ] = useState('');
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [sumandoEn, setSumandoEn] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState<{ texto: string; area: Area; prioridad: Prioridad }>({
    texto: '',
    area: 'Producción',
    prioridad: 'Media',
  });

  const listaZonas = Array.from(new Set(tareas.map((t) => t.zona)));

  const pasa = (t: OrgTarea, saltar?: 'z' | 'a' | 'p') =>
    (saltar === 'z' || !zonas.size || zonas.has(t.zona)) &&
    (saltar === 'a' || !areas.size || areas.has(t.area)) &&
    (saltar === 'p' || !prios.size || prios.has(t.prioridad)) &&
    (!soloPendientes || !t.hecho) &&
    (!q || `${t.texto} ${t.zona}`.toLowerCase().includes(q));
  const visibles = tareas.filter((t) => pasa(t));
  const hechas = tareas.filter((t) => t.hecho).length;

  async function guardar(fn: () => Promise<unknown>) {
    try {
      await fn();
      onAviso('');
    } catch {
      onAviso('No se pudo guardar. Recargá la página e intentá de nuevo.');
    }
  }
  const cambiar = (id: string, c: Partial<OrgTarea>) =>
    setTareas((ts) => ts.map((t) => (t.id === id ? { ...t, ...c } : t)));

  const tildar = (t: OrgTarea) => {
    cambiar(t.id, { hecho: !t.hecho });
    guardar(() => api(`/api/org/tareas/${t.id}`, 'PATCH', { hecho: !t.hecho }));
  };
  const siguientePrio = (t: OrgTarea) => {
    const p = PRIORIDADES[(PRIORIDADES.indexOf(t.prioridad) + 1) % PRIORIDADES.length];
    cambiar(t.id, { prioridad: p });
    guardar(() => api(`/api/org/tareas/${t.id}`, 'PATCH', { prioridad: p }));
  };
  const cambiarArea = (t: OrgTarea, area: Area) => {
    cambiar(t.id, { area });
    guardar(() => api(`/api/org/tareas/${t.id}`, 'PATCH', { area }));
  };
  const editar = (t: OrgTarea, texto: string) => {
    const x = texto.trim();
    if (!x || x === t.texto) return;
    cambiar(t.id, { texto: x });
    guardar(() => api(`/api/org/tareas/${t.id}`, 'PATCH', { texto: x }));
  };
  const borrar = (t: OrgTarea) => {
    if (!window.confirm('¿Borrar esta tarea?')) return;
    setTareas((ts) => ts.filter((x) => x.id !== t.id));
    guardar(() => api(`/api/org/tareas/${t.id}`, 'DELETE'));
  };
  const sumar = (zona: string) => {
    const texto = nuevo.texto.trim();
    if (!texto) return;
    guardar(async () => {
      const t: OrgTarea = await api('/api/org/tareas', 'POST', { zona, area: nuevo.area, prioridad: nuevo.prioridad, texto });
      setTareas((ts) => {
        // Entra al final de su zona, no de toda la lista.
        const ult = ts.map((x, i) => (x.zona === zona ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
        return [...ts.slice(0, ult + 1), t, ...ts.slice(ult + 1)];
      });
      setNuevo((n) => ({ ...n, texto: '' }));
      setSumandoEn(null);
    });
  };

  return (
    <>
      <div className="org-filtros org-t-filtros">
        <div className="org-t-fila">
          <span className="lbl">Zona</span>
          {listaZonas.map((z) => (
            <button
              key={z}
              className={`org-t-chip ${zonas.has(z) ? 'on' : ''}`}
              onClick={() => setZonas((s) => alternar(s, z))}
            >
              {z}<small>{tareas.filter((t) => t.zona === z && pasa(t, 'z')).length}</small>
            </button>
          ))}
        </div>
        <div className="org-t-fila">
          <span className="lbl">Área</span>
          {AREAS.map((a) => (
            <button key={a} className={`org-t-chip ${areas.has(a) ? 'on' : ''}`} onClick={() => setAreas((s) => alternar(s, a))}>
              {a}<small>{tareas.filter((t) => t.area === a && pasa(t, 'a')).length}</small>
            </button>
          ))}
        </div>
        <div className="org-t-fila">
          <span className="lbl">Prioridad</span>
          {PRIORIDADES.map((p) => (
            <button key={p} className={`org-t-chip ${prios.has(p) ? 'on' : ''}`} onClick={() => setPrios((s) => alternar(s, p))}>
              {p}<small>{tareas.filter((t) => t.prioridad === p && pasa(t, 'p')).length}</small>
            </button>
          ))}
          <label className="org-t-check">
            <input type="checkbox" checked={soloPendientes} onChange={(e) => setSoloPendientes(e.target.checked)} />
            Solo pendientes
          </label>
          <input
            type="search"
            className="org-t-buscar"
            placeholder="Buscar tarea…"
            value={q}
            onChange={(e) => setQ(e.target.value.toLowerCase())}
          />
          <button
            className="org-t-limpiar"
            onClick={() => { setZonas(new Set()); setAreas(new Set()); setPrios(new Set()); setQ(''); setSoloPendientes(false); }}
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="org-wrap org-t-lista">
        <p className="org-t-cuenta"><b>{visibles.length}</b> de {tareas.length} tareas · {hechas} hechas</p>
        {visibles.length === 0 && <p className="org-t-vacio">No hay tareas con esos filtros.</p>}
        {listaZonas.map((zona) => {
          const ts = visibles.filter((t) => t.zona === zona);
          const abierta = sumandoEn === zona;
          if (!ts.length && !abierta) return null;
          return (
            <section key={zona} className="org-t-zona">
              <h2>{zona}<em>{ts.length} {ts.length === 1 ? 'tarea' : 'tareas'}</em></h2>
              {ts.map((t) => (
                <div key={t.id} className={`org-t-tarea ${t.hecho ? 'hecha' : ''}`}>
                  <input type="checkbox" checked={t.hecho} onChange={() => tildar(t)} aria-label="Hecha" />
                  <select
                    className="org-t-area"
                    style={{ background: COLOR_AREA[t.area] }}
                    value={t.area}
                    onChange={(e) => cambiarArea(t, e.target.value as Area)}
                    aria-label="Área"
                  >
                    {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                  {editando === t.id ? (
                    <textarea
                      autoFocus
                      defaultValue={t.texto}
                      rows={2}
                      onBlur={(e) => { editar(t, e.target.value); setEditando(null); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); }
                        if (e.key === 'Escape') setEditando(null);
                      }}
                    />
                  ) : (
                    <span className="org-t-texto" onClick={() => setEditando(t.id)} title="Click para editar">{t.texto}</span>
                  )}
                  <button className={`org-t-prio ${t.prioridad}`} onClick={() => siguientePrio(t)} title="Click para cambiar la prioridad">
                    {t.prioridad}
                  </button>
                  <button className="org-t-x" onClick={() => borrar(t)} aria-label="Borrar">×</button>
                </div>
              ))}
              {abierta ? (
                <div className="org-t-nueva">
                  <select value={nuevo.area} onChange={(e) => setNuevo((n) => ({ ...n, area: e.target.value as Area }))} aria-label="Área">
                    {AREAS.map((a) => <option key={a}>{a}</option>)}
                  </select>
                  <select value={nuevo.prioridad} onChange={(e) => setNuevo((n) => ({ ...n, prioridad: e.target.value as Prioridad }))} aria-label="Prioridad">
                    {PRIORIDADES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                  <input
                    autoFocus
                    value={nuevo.texto}
                    onChange={(e) => setNuevo((n) => ({ ...n, texto: e.target.value }))}
                    placeholder="Nueva tarea y Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') sumar(zona);
                      if (e.key === 'Escape') setSumandoEn(null);
                    }}
                  />
                  <button onClick={() => sumar(zona)} disabled={!nuevo.texto.trim()}>Agregar</button>
                  <button className="cancelar" onClick={() => setSumandoEn(null)}>Cancelar</button>
                </div>
              ) : (
                <button className="org-t-mas" onClick={() => { setSumandoEn(zona); }}>+ agregar tarea</button>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
