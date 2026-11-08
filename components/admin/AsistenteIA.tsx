'use client';

import { useRef, useState } from 'react';
import { Bot, Loader2, Send, Mail, X, Check } from 'lucide-react';

interface Propuesta { para: string; asunto: string; texto: string }
interface Firmada { propuesta: Propuesta; exp: number; firma: string }
interface Mensaje { role: 'user' | 'assistant'; content: string; propuestas?: Firmada[] }
type Estado = 'pendiente' | 'enviando' | 'enviado' | 'descartado' | 'error';

const SUGERENCIAS = [
  '¿Qué tengo pendiente hoy?',
  '¿Quién tiene la membresía vencida? Preparame el aviso para cada uno.',
  '¿Hay solicitudes de cowork sin responder?',
  '¿Llegaron propuestas nuevas?',
];

function TarjetaMail({ item }: { item: Firmada }) {
  const [estado, setEstado] = useState<Estado>('pendiente');
  const [error, setError] = useState<string | null>(null);

  const enviar = async () => {
    setEstado('enviando');
    setError(null);
    try {
      const res = await fetch('/api/admin/ia/ejecutar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? 'No se pudo enviar.');
      setEstado('enviado');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar.');
      setEstado('error');
    }
  };

  return (
    <div className="rounded-xl border border-manso-cream/15 bg-manso-cream/5 p-4 space-y-2">
      <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-manso-cream/62">
        <Mail size={14} aria-hidden /> Para: <span className="normal-case tracking-normal text-manso-cream">{item.propuesta.para}</span>
      </p>
      <p className="text-[15px] font-bold text-manso-cream">{item.propuesta.asunto}</p>
      <p className="whitespace-pre-line text-[14px] leading-relaxed text-manso-cream/85">{item.propuesta.texto}</p>
      {error && <p role="alert" className="text-[13px] text-red-400">{error}</p>}
      {estado === 'enviado' ? (
        <p className="flex items-center gap-2 text-[13px] font-bold text-green-400"><Check size={14} aria-hidden /> Enviado</p>
      ) : estado === 'descartado' ? (
        <p className="text-[13px] text-manso-cream/62">Descartado</p>
      ) : (
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={enviar} disabled={estado === 'enviando'}
            className="flex items-center gap-2 rounded-xl bg-manso-cream px-4 py-2 text-[13px] font-bold uppercase tracking-wider text-manso-black disabled:opacity-40">
            {estado === 'enviando' ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Send size={14} aria-hidden />}
            {estado === 'enviando' ? 'Enviando…' : 'Enviar'}
          </button>
          <button type="button" onClick={() => setEstado('descartado')} disabled={estado === 'enviando'}
            className="flex items-center gap-2 rounded-xl border border-manso-cream/20 px-4 py-2 text-[13px] font-bold uppercase tracking-wider text-manso-cream/80 disabled:opacity-40">
            <X size={14} aria-hidden /> Descartar
          </button>
        </div>
      )}
    </div>
  );
}

/** Asistente de gestión: consulta el panel y deja mails listos; nada se envía sin tu botón. */
export function AsistenteIA() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fin = useRef<HTMLDivElement>(null);

  const enviar = async (contenido: string) => {
    const limpio = contenido.trim();
    if (!limpio || cargando) return;
    const nuevos: Mensaje[] = [...mensajes, { role: 'user', content: limpio }];
    setMensajes(nuevos);
    setTexto('');
    setError(null);
    setCargando(true);
    try {
      const res = await fetch('/api/admin/ia/asistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Las propuestas no vuelven al modelo: solo el texto de la charla.
        body: JSON.stringify({ mensajes: nuevos.slice(-12).map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? 'No se pudo responder.');
      setMensajes([...nuevos, { role: 'assistant', content: data.respuesta, propuestas: data.propuestas }]);
      setTimeout(() => fin.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo responder.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-start gap-3">
        <Bot size={28} className="mt-1 text-manso-terra" aria-hidden />
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-manso-cream">Asistente</h2>
          <p className="text-[14px] text-manso-cream/70">
            Consulta membresías, solicitudes y propuestas, y te deja mails listos para revisar. No envía nada hasta que aprietes <strong>Enviar</strong>.
          </p>
        </div>
      </header>

      {mensajes.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGERENCIAS.map(s => (
            <button key={s} type="button" onClick={() => enviar(s)}
              className="rounded-xl border border-manso-cream/15 bg-manso-cream/5 px-4 py-2 text-left text-[14px] text-manso-cream/85 hover:bg-manso-cream/10">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4" aria-live="polite">
        {mensajes.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'space-y-3'}>
            {m.role === 'user' ? (
              <p className="max-w-[85%] rounded-2xl bg-manso-cream px-4 py-2.5 text-[15px] text-manso-black">{m.content}</p>
            ) : (
              <>
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-manso-cream">{m.content}</p>
                {m.propuestas?.map((p, j) => <TarjetaMail key={`${i}-${j}-${p.firma}`} item={p} />)}
              </>
            )}
          </div>
        ))}
        {cargando && <p className="flex items-center gap-2 text-[14px] text-manso-cream/70"><Loader2 size={14} className="animate-spin" aria-hidden /> Pensando…</p>}
        {error && <p role="alert" className="text-[14px] text-red-400">{error}</p>}
        <div ref={fin} />
      </div>

      <form onSubmit={e => { e.preventDefault(); enviar(texto); }} className="flex gap-2">
        <input
          value={texto}
          onChange={e => setTexto(e.target.value)}
          maxLength={1000}
          placeholder="Preguntale algo al asistente…"
          aria-label="Mensaje para el asistente"
          className="flex-1 rounded-xl border border-manso-cream/10 bg-manso-cream/5 px-4 py-3 text-[15px] text-manso-cream placeholder:text-manso-cream/62 focus:outline-none focus:border-manso-terra"
        />
        <button type="submit" disabled={cargando || !texto.trim()}
          className="flex items-center gap-2 rounded-xl bg-manso-terra px-5 py-3 text-[13px] font-bold uppercase tracking-wider text-white disabled:opacity-40">
          <Send size={14} aria-hidden /> Enviar
        </button>
      </form>
    </div>
  );
}
