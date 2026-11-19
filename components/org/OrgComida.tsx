'use client';

import { useMemo, useState } from 'react';
import { COMIDAS, type OrgComida } from '@/lib/org-tipos';

const fecha = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' });

const csv = (v: string) => `"${v.replace(/"/g, '""')}"`;

/**
 * Respuestas del formulario de comida (/org/comida). Arriba el link para mandar
 * a toda la org (copiar o WhatsApp); abajo el conteo por comida, dieta y
 * alergias, que es lo que necesita el catering, y la lista por persona.
 */
export function OrgComidaPanel({ inicial, token, onAviso }: { inicial: OrgComida[]; token: string; onAviso: (m: string) => void }) {
  const [filas, setFilas] = useState(inicial);
  const [copiado, setCopiado] = useState(false);
  const [q, setQ] = useState('');

  const base = `${typeof window === 'undefined' ? '' : window.location.origin}/org/comida/${token}`;
  const link = base;
  const linkArtistas = `${base}/artistas`;

  const resumen = useMemo(() => {
    const cuenta = (campo: 'comidas' | 'dieta' | 'bebida') => {
      const m = new Map<string, number>();
      filas.forEach((f) => f[campo].forEach((x) => m.set(x, (m.get(x) ?? 0) + 1)));
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };
    return { comidas: cuenta('comidas'), dieta: cuenta('dieta'), bebida: cuenta('bebida'), alergias: filas.filter((f) => f.alergias) };
  }, [filas]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      onAviso('No se pudo copiar: seleccioná el link y copialo a mano.');
    }
  };

  const borrar = async (f: OrgComida) => {
    if (!confirm(`¿Borrar la respuesta de ${f.nombre}?`)) return;
    const antes = filas;
    setFilas((x) => x.filter((y) => y.id !== f.id));
    const res = await fetch(`/api/org/comida/${f.id}`, { method: 'DELETE' }).catch(() => null);
    if (!res?.ok) {
      setFilas(antes);
      onAviso('No se pudo borrar. Probá de nuevo.');
    }
  };

  const descargar = () => {
    const cab = ['Fecha', 'Nombre', 'Área', 'Comidas', 'Dieta', 'Alergias', 'Bebida', 'Extras', 'Escenario', 'Horario', 'Come', 'En cabina'];
    const rows = filas.map((f) => [fecha(f.created_at), f.nombre, f.area, f.comidas.join(', '), f.dieta.join(', '), f.alergias ?? '', f.bebida.join(', '), f.extras ?? '', f.escenario ?? '', f.horario ?? '', f.comer ?? '', f.bebida_set ?? '']);
    const blob = new Blob(['﻿' + [cab, ...rows].map((r) => r.map(csv).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'comida-blur.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const visibles = filas.filter((f) => !q.trim() || `${f.nombre} ${f.area}`.toLowerCase().includes(q.trim().toLowerCase()));
  const wa = `https://wa.me/?text=${encodeURIComponent(`Completá qué querés comer en BLUR (te lleva 1 minuto): ${link}`)}`;

  return (
    <div className="org-t-lista">
      <div className="org-c-link">
        <div>
          <b>Link para la organización</b>
          <p>Abre sin clave, pero solo con este link completo (la dirección no se puede adivinar). Mandáselo a todos.</p>
          <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} aria-label="Link del formulario" />
        </div>
        <div className="org-c-btns">
          <a href={`https://wa.me/?text=${encodeURIComponent(`Completá tu hospitality para BLUR (1 minuto): ${linkArtistas}`)}`} target="_blank" rel="noopener noreferrer">Link artistas: WhatsApp</a>
          <button onClick={() => navigator.clipboard.writeText(linkArtistas).then(() => onAviso('Link de artistas copiado.'), () => onAviso('No se pudo copiar.'))}>Copiar link artistas</button>
          <button onClick={copiar}>{copiado ? '¡Copiado!' : 'Copiar link'}</button>
          <a href={wa} target="_blank" rel="noopener noreferrer">Mandar por WhatsApp</a>
          <a href={link} target="_blank" rel="noopener noreferrer">Ver formulario</a>
        </div>
      </div>

      <p className="org-t-cuenta"><b>{filas.length}</b> {filas.length === 1 ? 'persona respondió' : 'personas respondieron'}</p>

      {filas.length > 0 && (
        <div className="org-c-resumen">
          <div><h3>Comidas</h3>{COMIDAS.map((c) => <p key={c}><span>{c}</span><b>{resumen.comidas.find(([k]) => k === c)?.[1] ?? 0}</b></p>)}</div>
          <div><h3>Dieta</h3>{resumen.dieta.length ? resumen.dieta.map(([k, n]) => <p key={k}><span>{k}</span><b>{n}</b></p>) : <p><span>—</span></p>}</div>
          <div><h3>Bebida</h3>{resumen.bebida.length ? resumen.bebida.map(([k, n]) => <p key={k}><span>{k}</span><b>{n}</b></p>) : <p><span>—</span></p>}</div>
          {resumen.alergias.length > 0 && (
            <div className="alergias"><h3>Alergias / no comen</h3>{resumen.alergias.map((f) => <p key={f.id}><span>{f.nombre}</span><i>{f.alergias}</i></p>)}</div>
          )}
        </div>
      )}

      {filas.length > 0 && (
        <div className="org-c-barra">
          <input className="org-t-buscar" placeholder="Buscar por nombre o área" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="org-t-limpiar" onClick={descargar}>Descargar CSV</button>
        </div>
      )}

      {visibles.map((f) => (
        <div key={f.id} className="org-c-fila">
          <div className="top">
            <b>{f.nombre}</b><span className="area">{f.area}</span><span className="fec">{fecha(f.created_at)}</span>
            <button onClick={() => borrar(f)} aria-label={`Borrar a ${f.nombre}`}>Borrar</button>
          </div>
          {f.escenario && <p><em>Set</em> {f.escenario} · {f.horario}</p>}
          {f.comer && <p><em>Come</em> {f.comer}</p>}
          {f.comidas.length > 0 && <p><em>Comidas</em> {f.comidas.join(', ')}</p>}
          {f.dieta.length > 0 && <p><em>Dieta</em> {f.dieta.join(', ')}</p>}
          {f.alergias && <p><em>Alergias</em> {f.alergias}</p>}
          {f.bebida.length > 0 && <p><em>Bebida</em> {f.bebida.join(', ')}</p>}
          {f.bebida_set && <p><em>En cabina</em> {f.bebida_set}</p>}
          {f.extras && <p><em>Extras</em> {f.extras}</p>}
        </div>
      ))}
      {filas.length === 0 && <p className="org-t-vacio">Todavía no respondió nadie. Mandá el link.</p>}
    </div>
  );
}
