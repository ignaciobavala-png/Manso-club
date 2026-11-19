'use client';

import { useEffect, useState } from 'react';
import { AREAS_COMIDA, BEBIDAS, COMIDAS, DIETAS } from '@/lib/org-tipos';

const BORRADOR = 'blur-org-comida';
const VACIO = { nombre: '', area: '', comidas: [] as string[], dieta: [] as string[], alergias: '', bebida: [] as string[], extras: '', web: '' };
type Datos = typeof VACIO;

function Chips({ nombre, opciones, valor, onChange }: { nombre: string; opciones: readonly string[]; valor: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="chips">
      {opciones.map((o) => (
        <label key={o}>
          <input
            type="checkbox"
            name={nombre}
            checked={valor.includes(o)}
            onChange={() => onChange(valor.includes(o) ? valor.filter((x) => x !== o) : [...valor, o])}
          />
          <span>{o}</span>
        </label>
      ))}
    </div>
  );
}

/** Formulario público. Guarda un borrador en el navegador para que no se pierda si cierran la pestaña. */
export function FormComida({ token }: { token: string }) {
  const [d, setD] = useState<Datos>(VACIO);
  // El borrador se lee después de montar: en el render del servidor no hay localStorage y el HTML tiene que coincidir.
  useEffect(() => {
    try {
      const g = JSON.parse(localStorage.getItem(BORRADOR) ?? 'null');
      if (g) setD({ ...VACIO, ...g, web: '' });
    } catch { /* sin localStorage: el formulario anda igual */ }
  }, []);
  const [err, setErr] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState<null | { actualizado: boolean }>(null);

  const set = <K extends keyof Datos>(k: K, v: Datos[K]) =>
    setD((p) => {
      const n = { ...p, [k]: v };
      try { localStorage.setItem(BORRADOR, JSON.stringify(n)); } catch { /* sin localStorage: el formulario anda igual */ }
      return n;
    });

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!d.nombre.trim() || !d.area) return setErr('Completá tu nombre y tu área.');
    if (!d.comidas.length) return setErr('Elegí al menos una comida.');
    setErr('');
    setEnviando(true);
    try {
      const res = await fetch('/api/org/comida', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...d, token }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'fallo');
      setListo({ actualizado: Boolean(j.actualizado) });
      window.scrollTo({ top: 0 });
    } catch (x) {
      setErr(x instanceof Error && x.message !== 'fallo' ? x.message : 'No se pudo enviar. Revisá tu conexión y probá de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <section>
        <h3><b>✓</b> {listo.actualizado ? 'Actualizado' : 'Recibido'}</h3>
        <p className="sub" style={{ margin: 0 }}>Gracias, {d.nombre.trim().split(' ')[0]}. Ya tenemos tu comida. Nos vemos en la isla.</p>
        <button type="button" className="otro" onClick={() => setListo(null)}>Editar mis respuestas</button>
      </section>
    );
  }

  return (
    <form onSubmit={enviar} noValidate>
      <section>
        <h3><b>01</b> Quién sos</h3>
        <div className="grid">
          <div className="full">
            <label className="f" htmlFor="nombre">Nombre y apellido <em>*</em></label>
            <input id="nombre" type="text" autoComplete="name" value={d.nombre} maxLength={120} onChange={(e) => set('nombre', e.target.value)} />
          </div>
          <div className="full">
            <label className="f" htmlFor="area">Tu área <em>*</em></label>
            <select id="area" value={d.area} onChange={(e) => set('area', e.target.value)}>
              <option value="">—</option>
              {AREAS_COMIDA.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          {/* Honeypot: una persona no lo ve ni lo llena. */}
          <div className="trampa" aria-hidden="true">
            <input type="text" tabIndex={-1} autoComplete="off" value={d.web} onChange={(e) => setD((p) => ({ ...p, web: e.target.value }))} />
          </div>
        </div>
      </section>

      <section>
        <h3><b>02</b> Comida</h3>
        <div className="grid">
          <div className="full">
            <label className="f">¿Qué comidas necesitás ese día? <em>*</em></label>
            <Chips nombre="comidas" opciones={COMIDAS} valor={d.comidas} onChange={(v) => set('comidas', v)} />
          </div>
          <div className="full">
            <label className="f">Dieta</label>
            <Chips nombre="dieta" opciones={DIETAS} valor={d.dieta} onChange={(v) => set('dieta', v)} />
          </div>
          <div className="full">
            <label className="f" htmlFor="alergias">Alergias o cosas que no comés</label>
            <input id="alergias" type="text" maxLength={300} placeholder="ej. maní (alergia severa), cilantro" value={d.alergias} onChange={(e) => set('alergias', e.target.value)} />
          </div>
        </div>
      </section>

      <section>
        <h3><b>03</b> Bebida</h3>
        <p className="sub">Agua siempre disponible.</p>
        <Chips nombre="bebida" opciones={BEBIDAS} valor={d.bebida} onChange={(v) => set('bebida', v)} />
      </section>

      <section>
        <h3><b>04</b> Algo más</h3>
        <input type="text" maxLength={500} placeholder="Opcional" value={d.extras} onChange={(e) => set('extras', e.target.value)} />
      </section>

      <div className="actions">
        <div className="err" role="alert">{err}</div>
        <button type="submit" className="enviar" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar'}</button>
      </div>
    </form>
  );
}
