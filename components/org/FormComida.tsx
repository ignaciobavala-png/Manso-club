'use client';

import { useEffect, useState } from 'react';
import { AREAS_STAFF, BEBIDAS, COMER_ARTISTA, COMER_CHARLA, COMIDAS, DIETAS, LINEUP_HOSP, type TipoComida } from '@/lib/org-tipos';

const VACIO = { dieta: [] as string[], alergias: '', bebida: [] as string[], extras: '', artista: '', comer: '', bebida_set: '', web: '', nombre: '', charla: '', horario: '', area: '', comidas: [] as string[] };
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
export function FormComida({ token, tipo }: { token: string; tipo: TipoComida }) {
  // Un borrador por formulario: el de staff no pisa al de artistas si alguien abre los dos.
  const BORRADOR = `blur-org-comida-${tipo}`;
  const opcionesComer = tipo === 'charlas' ? COMER_CHARLA : COMER_ARTISTA;
  const [d, setD] = useState<Datos>(VACIO);
  // El borrador se lee después de montar: en el render del servidor no hay localStorage y el HTML tiene que coincidir.
  useEffect(() => {
    try {
      const g = JSON.parse(localStorage.getItem(BORRADOR) ?? 'null');
      if (g) setD({ ...VACIO, ...g, web: '' });
    } catch { /* sin localStorage: el formulario anda igual */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (tipo === 'artistas') {
      if (!d.artista) return setErr('Elegí tu nombre.');
      if (!d.comer) return setErr('Elegí si querés comer antes o después del set.');
    } else {
      if (!d.nombre.trim()) return setErr('Escribí tu nombre.');
      if (tipo === 'charlas') {
        if (!d.charla.trim()) return setErr('Escribí de qué charla o panel sos.');
        if (!d.comer) return setErr('Elegí si querés comer antes o después de la charla.');
      } else {
        if (!d.area) return setErr('Elegí tu área.');
        if (d.comidas.length === 0) return setErr('Elegí qué comidas necesitás.');
      }
    }
    setErr('');
    setEnviando(true);
    try {
      const res = await fetch('/api/org/comida', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...d, tipo, token }) });
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
        <p className="sub" style={{ margin: 0 }}>Gracias, {(tipo === 'artistas' ? d.artista : d.nombre).trim().split(' ')[0]}. Ya tenemos tu comida. Nos vemos en la isla.</p>
        <button type="button" className="otro" onClick={() => setListo(null)}>Editar mis respuestas</button>
      </section>
    );
  }

  return (
    <form onSubmit={enviar} noValidate>
      <section>
        <h3><b>01</b> Quién sos</h3>
        <div className="grid">
          {tipo === 'artistas' ? (
            <>
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
            </>
          ) : (
            <>
              <div className="full">
                <label className="f" htmlFor="nombre">Tu nombre <em>*</em></label>
                <input id="nombre" type="text" maxLength={120} autoComplete="name" value={d.nombre} onChange={(e) => set('nombre', e.target.value)} />
              </div>
              {tipo === 'charlas' ? (
                <>
                  <div className="full">
                    <label className="f" htmlFor="charla">¿De qué charla o panel sos? <em>*</em></label>
                    <input id="charla" type="text" maxLength={160} value={d.charla} onChange={(e) => set('charla', e.target.value)} />
                  </div>
                  <div className="full">
                    <label className="f" htmlFor="horario">Horario de tu charla</label>
                    <input id="horario" type="text" maxLength={60} placeholder="Opcional · ej. 17:00 a 18:00" value={d.horario} onChange={(e) => set('horario', e.target.value)} />
                  </div>
                </>
              ) : (
                <div className="full">
                  <label className="f">Tu área <em>*</em></label>
                  <div className="chips">
                    {AREAS_STAFF.map((a) => (
                      <label key={a}>
                        <input type="radio" name="area" checked={d.area === a} onChange={() => set('area', a)} />
                        <span>{a}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
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
          {tipo === 'staff' ? (
            <div className="full">
              <label className="f">¿Qué comidas necesitás? <em>*</em></label>
              <Chips nombre="comidas" opciones={COMIDAS} valor={d.comidas} onChange={(v) => set('comidas', v)} />
            </div>
          ) : (
            <div className="full">
              <label className="f">¿Cuándo querés comer? <em>*</em></label>
              <div className="chips">
                {opcionesComer.map((c) => (
                  <label key={c}>
                    <input type="radio" name="comer" checked={d.comer === c} onChange={() => set('comer', c)} />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
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
        {tipo !== 'staff' && (
          <div style={{ marginTop: 18 }}>
            <label className="f" htmlFor="bebida_set">{tipo === 'charlas' ? '¿Qué querés tener en la mesa durante la charla?' : '¿Qué querés tener en cabina mientras tocás?'}</label>
            <input id="bebida_set" type="text" maxLength={300} placeholder={tipo === 'charlas' ? 'ej. agua sin gas y un café' : 'ej. agua con gas fría y un gin tonic'} value={d.bebida_set} onChange={(e) => set('bebida_set', e.target.value)} />
          </div>
        )}
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
