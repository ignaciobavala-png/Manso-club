'use client';

import { useEffect, useState } from 'react';
import { AREA_ARTISTAS, BEBIDAS, COMER_ARTISTA, DIETAS, LINEUP_HOSP } from '@/lib/org-tipos';

const BORRADOR = 'blur-org-comida-artistas';
const VACIO = { dieta: [] as string[], alergias: '', bebida: [] as string[], extras: '', artista: '', comer: '', bebida_set: '', web: '' };
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

  const slot = LINEUP_HOSP.find((a) => a.n === d.artista);

  const set = <K extends keyof Datos>(k: K, v: Datos[K]) =>
    setD((p) => {
      const n = { ...p, [k]: v };
      try { localStorage.setItem(BORRADOR, JSON.stringify(n)); } catch { /* sin localStorage: el formulario anda igual */ }
      return n;
    });

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!d.artista) return setErr('Elegí tu nombre.');
    if (!d.comer) return setErr('Elegí si querés comer antes o después del set.');
    setErr('');
    setEnviando(true);
    try {
      const res = await fetch('/api/org/comida', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...d, area: AREA_ARTISTAS, token }) });
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
        <p className="sub" style={{ margin: 0 }}>Gracias, {d.artista.split(' ')[0]}. Ya tenemos tu comida. Nos vemos en la isla.</p>
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
                <label className="f">Elegí tu nombre <em>*</em></label>
                {[...new Set(LINEUP_HOSP.map((a) => a.stage))].map((st) => (
                  <div key={st} style={{ marginBottom: 12 }}>
                    <span className="mono" style={{ display: 'block', opacity: 0.65, margin: '0 0 6px' }}>{st}</span>
                    <div className="chips">
                      {LINEUP_HOSP.filter((a) => a.stage === st).map((a) => (
                        <label key={a.n}>
                          <input type="radio" name="artista" checked={d.artista === a.n} onChange={() => set('artista', a.n)} />
                          <span>{a.n}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {slot && (
                <div className="full slot">
                  <div><span className="mono">Escenario</span><strong>{slot.stage}</strong></div>
                  <div><span className="mono">Horario</span><strong>{slot.time}</strong></div>
                </div>
              )}
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
              <label className="f">¿Cuándo querés comer? <em>*</em></label>
              <div className="chips">
                {COMER_ARTISTA.map((c) => (
                  <label key={c}>
                    <input type="radio" name="comer" checked={d.comer === c} onChange={() => set('comer', c)} />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
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
        <div style={{ marginTop: 18 }}>
            <label className="f" htmlFor="bebida_set">¿Qué querés tener en cabina mientras tocás?</label>
            <input id="bebida_set" type="text" maxLength={300} placeholder="ej. agua con gas fría y un gin tonic" value={d.bebida_set} onChange={(e) => set('bebida_set', e.target.value)} />
        </div>
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
