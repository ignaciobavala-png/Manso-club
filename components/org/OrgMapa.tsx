'use client';

import { useMemo, useRef, useState } from 'react';
import type { Nivel, OrgComida, OrgItem, OrgMapa as Mapa, OrgTarea } from '@/lib/org';
import { COMIDA_TIPOS, TIPOS_COMIDA, type TipoComida } from '@/lib/org-tipos';
import { OrgTareas } from './OrgTareas';
import { OrgComidaPanel } from './OrgComida';

const FILAS: { k: Nivel; n: string; c: string }[] = [
  { k: 'staff', n: 'Staff', c: '#b53fbd' },
  { k: 'sen', n: 'Señalética', c: '#2fa84b' },
  { k: 'tou', n: 'Touchpoints', c: '#2a7fd0' },
  { k: 'nec', n: 'Necesidades', c: '#a39f1f' },
  { k: 'her', n: 'Herramientas', c: '#1f9f8a' },
  { k: 'des', n: 'Desafíos', c: '#17090a' },
  { k: 'dol', n: 'Puntos de Dolor', c: '#c23d4b' },
  { k: 'emo', n: 'Emociones y Sensaciones', c: '#7a3fc2' },
];

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error('fallo');
  return res.json();
}

/**
 * Matriz de coordinación de BLUR: columnas = espacios del predio, filas = los
 * ocho niveles. Cada ítem se tilda como resuelto, se edita con un click y se
 * puede sumar o borrar. Los cambios se guardan al instante (optimista: si el
 * servidor falla, se avisa y se recarga el estado).
 */
export function OrgMapa({ mapasIniciales, tareasIniciales, comidaInicial, tokensComida }: { mapasIniciales: Mapa[]; tareasIniciales: OrgTarea[]; comidaInicial: OrgComida[]; tokensComida: Record<TipoComida, string> }) {
  const [mapas, setMapas] = useState(mapasIniciales);
  const [mapaId, setMapaId] = useState(mapasIniciales[0]?.id ?? '');
  const [tipoComida, setTipoComida] = useState<TipoComida>('artistas');
  const [ocultas, setOcultas] = useState<Nivel[]>([]);
  const [aviso, setAviso] = useState('');
  const wrap = useRef<HTMLDivElement>(null);

  const enTareas = mapaId === 'tareas';
  const enComida = mapaId === 'comida';
  const mapa = mapas.find((m) => m.id === mapaId) ?? mapas[0];

  const cambiarItem = (id: string, fn: (i: OrgItem) => OrgItem) =>
    setMapas((ms) =>
      ms.map((m) => ({
        ...m,
        fases: m.fases.map((f) => ({
          ...f,
          espacios: f.espacios.map((e) => ({ ...e, items: e.items.map((i) => (i.id === id ? fn(i) : i)) })),
        })),
      })),
    );

  const quitarItem = (id: string) =>
    setMapas((ms) =>
      ms.map((m) => ({
        ...m,
        fases: m.fases.map((f) => ({
          ...f,
          espacios: f.espacios.map((e) => ({ ...e, items: e.items.filter((i) => i.id !== id) })),
        })),
      })),
    );

  async function guardar(fn: () => Promise<unknown>) {
    try {
      await fn();
      setAviso('');
    } catch {
      setAviso('No se pudo guardar. Recargá la página e intentá de nuevo.');
    }
  }

  const tildar = (it: OrgItem) => {
    cambiarItem(it.id, (i) => ({ ...i, hecho: !i.hecho }));
    guardar(() => api(`/api/org/items/${it.id}`, 'PATCH', { hecho: !it.hecho }));
  };
  const editar = (it: OrgItem, texto: string) => {
    const t = texto.trim();
    if (!t || t === it.texto) return;
    cambiarItem(it.id, (i) => ({ ...i, texto: t }));
    guardar(() => api(`/api/org/items/${it.id}`, 'PATCH', { texto: t }));
  };
  const borrar = (it: OrgItem) => {
    if (!window.confirm('¿Borrar este ítem?')) return;
    quitarItem(it.id);
    guardar(() => api(`/api/org/items/${it.id}`, 'DELETE'));
  };
  const sumar = (espacioId: string, nivel: Nivel, texto: string) =>
    guardar(async () => {
      const nuevo: OrgItem = await api('/api/org/items', 'POST', { espacio_id: espacioId, nivel, texto });
      setMapas((ms) =>
        ms.map((m) => ({
          ...m,
          fases: m.fases.map((f) => ({
            ...f,
            espacios: f.espacios.map((e) => (e.id === espacioId ? { ...e, items: [...e.items, nuevo] } : e)),
          })),
        })),
      );
    });

  const filas = FILAS.filter((f) => !ocultas.includes(f.k));
  const totales = useMemo(() => {
    let t = 0;
    let h = 0;
    mapa?.fases.forEach((f) => f.espacios.forEach((e) => e.items.forEach((i) => { t++; if (i.hecho) h++; })));
    return { t, h };
  }, [mapa]);

  if (!mapa) return <main className="org org-login"><p className="org-login-msg">No hay mapas cargados.</p></main>;

  const irA = (faseId: string) => {
    const el = document.getElementById(`org-fase-${faseId}`);
    if (el && wrap.current) wrap.current.scrollTo({ left: el.offsetLeft - 150, behavior: 'smooth' });
  };
  let n = 0;

  return (
    <div className="org">
      <header className="org-top">
        <h1>Blur <span>·</span> Organización</h1>
        <div className="org-tabs" role="tablist" aria-label="Mapa">
          {mapas.map((m) => (
            <button key={m.id} role="tab" aria-selected={m.id === mapaId} className={m.id === mapaId ? 'on' : ''} onClick={() => setMapaId(m.id)}>
              {m.titulo}
            </button>
          ))}
          <button role="tab" aria-selected={enTareas} className={enTareas ? 'on' : ''} onClick={() => setMapaId('tareas')}>
            Plan de tareas
          </button>
          <button role="tab" aria-selected={enComida} className={enComida ? 'on' : ''} onClick={() => setMapaId('comida')}>
            Comida
          </button>
        </div>
        {!enTareas && !enComida && <span className="org-prog">{totales.h} / {totales.t} resueltos</span>}
      </header>

      {aviso && <p className="org-aviso" role="alert">{aviso}</p>}

      {enComida ? (
        <div className="org-wrap">
          <div className="org-tabs" role="tablist" aria-label="Formulario de comida" style={{ marginBottom: 14 }}>
            {TIPOS_COMIDA.map((t) => (
              <button key={t} role="tab" aria-selected={tipoComida === t} className={tipoComida === t ? 'on' : ''} onClick={() => setTipoComida(t)}>
                {COMIDA_TIPOS[t].etiqueta}
              </button>
            ))}
          </div>
          <OrgComidaPanel inicial={comidaInicial} tipo={tipoComida} token={tokensComida[tipoComida]} onAviso={setAviso} />
        </div>
      ) : enTareas ? (
        <OrgTareas tareasIniciales={tareasIniciales} onAviso={setAviso} />
      ) : (
        <>
      <div className="org-filtros">
        <span className="lbl">Niveles</span>
        {FILAS.map((f) => (
          <button
            key={f.k}
            className={`chip ${ocultas.includes(f.k) ? 'off' : ''}`}
            style={{ ['--c' as string]: f.c }}
            onClick={() => setOcultas((o) => (o.includes(f.k) ? o.filter((x) => x !== f.k) : [...o, f.k]))}
          >
            <i />{f.n}
          </button>
        ))}
        <div className="org-fasesnav">
          {mapa.fases.map((f) => (
            <button key={f.id} onClick={() => irA(f.id)}>{f.nombre}</button>
          ))}
        </div>
      </div>

      <div className="org-wrap" ref={wrap}>
        <table>
          <thead>
            <tr className="ph">
              <th className="stick" />
              {mapa.fases.map((f) => (
                <th key={f.id} id={`org-fase-${f.id}`} className="phase" colSpan={f.espacios.length}>
                  <span>{f.nombre}</span>
                </th>
              ))}
            </tr>
            <tr className="hd">
              <th className="stick" />
              {mapa.fases.flatMap((f) =>
                f.espacios.map((e) => {
                  n++;
                  return (
                    <th key={e.id} className="col">
                      <span className="num">{n}</span>
                      <b>{e.nombre}</b>
                      {e.plano && <span className="med" title={e.plano}>{e.plano}</span>}
                      {e.cerca && <span className="med ce"><b>Cerca (≈ m):</b> {e.cerca}</span>}
                    </th>
                  );
                }),
              )}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.k}>
                <th className="rowlab stick" style={{ ['--c' as string]: fila.c }}><div>{fila.n}</div></th>
                {mapa.fases.flatMap((f) =>
                  f.espacios.map((e) => (
                    <td key={e.id}>
                      <Celda
                        fila={fila}
                        items={e.items.filter((i) => i.nivel === fila.k)}
                        onTildar={tildar}
                        onEditar={editar}
                        onBorrar={borrar}
                        onSumar={(t) => sumar(e.id, fila.k, t)}
                      />
                    </td>
                  )),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        </>
      )}
    </div>
  );
}

function Celda({
  fila, items, onTildar, onEditar, onBorrar, onSumar,
}: {
  fila: { k: Nivel; c: string };
  items: OrgItem[];
  onTildar: (i: OrgItem) => void;
  onEditar: (i: OrgItem, t: string) => void;
  onBorrar: (i: OrgItem) => void;
  onSumar: (t: string) => void;
}) {
  const [editando, setEditando] = useState<string | null>(null);
  const [sumando, setSumando] = useState(false);
  const [nuevo, setNuevo] = useState('');
  const clase = fila.k === 'des' ? 'card des' : fila.k === 'emo' ? 'card emo' : 'card';

  return (
    <div className={clase} style={{ ['--c' as string]: fila.c }}>
      <ul>
        {items.map((it) => (
          <li key={it.id} className={`${it.riesgo ? 'risk' : ''} ${it.hecho ? 'hecho' : ''}`}>
            <input type="checkbox" checked={it.hecho} onChange={() => onTildar(it)} aria-label="Resuelto" />
            {it.riesgo && <span className="rk">Plano</span>}
            {editando === it.id ? (
              <textarea
                autoFocus
                defaultValue={it.texto}
                rows={2}
                onBlur={(e) => { onEditar(it, e.target.value); setEditando(null); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); }
                  if (e.key === 'Escape') setEditando(null);
                }}
              />
            ) : (
              <span className="txt" onClick={() => setEditando(it.id)} title="Click para editar">{it.texto}</span>
            )}
            <button className="x" onClick={() => onBorrar(it)} aria-label="Borrar">×</button>
          </li>
        ))}
      </ul>
      {sumando ? (
        <input
          className="nuevo"
          autoFocus
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          placeholder="Escribí y Enter"
          onBlur={() => { setSumando(false); setNuevo(''); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && nuevo.trim()) { onSumar(nuevo.trim()); setNuevo(''); setSumando(false); }
            if (e.key === 'Escape') { setSumando(false); setNuevo(''); }
          }}
        />
      ) : (
        <button className="mas" onClick={() => setSumando(true)}>+ agregar</button>
      )}
    </div>
  );
}
