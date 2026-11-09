'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, ArrowUp, Mail, X, Check, Paperclip, CalendarPlus, History, Plus, Trash2, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { codificarFoto, medidaConTope } from '@/lib/comprimir-imagen';
import { descargarArchivo, esPlanilla, leerPlanilla, type Planilla } from '@/lib/ia-archivos';
import type { ArchivoIA } from '@/lib/ia-herramientas';

interface Mail { para: string; asunto: string; texto: string }
interface Evento { titulo: string; fecha: string; fecha_fin: string | null; descripcion: string | null; categoria: string | null; link_tickets: string | null; imagen_url: string | null }
type Accion = { tipo: 'mail'; datos: Mail } | { tipo: 'evento'; datos: Evento };
interface Firmada { accion: Accion; exp: number; firma: string }

const MARCA_FOTO = /\n?\[Foto adjunta: (https?:\/\/\S+)\]/;

/** "2026-11-22T16:00" → "domingo 22 de noviembre, 16:00 hs" */
function fechaLinda(local: string): string {
  const [f, h] = local.split('T');
  const d = new Date(`${f}T12:00:00`);
  const t = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
  return `${t}, ${h} hs`;
}

/** Achica y comprime la foto en el navegador y la sube al bucket público de flyers. */
async function subirFoto(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, mal) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => mal(new Error('No se pudo leer la imagen.'));
      i.src = url;
    });
    const [w, h] = medidaConTope(img.width, img.height, 1920);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
    const { blob, ext, mime } = await codificarFoto(canvas);
    const ruta = `asistente/${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('flyers').upload(ruta, blob, { contentType: mime });
    if (error) throw error;
    return supabase.storage.from('flyers').getPublicUrl(ruta).data.publicUrl;
  } finally {
    URL.revokeObjectURL(url);
  }
}
type Estado = 'pendiente' | 'enviando' | 'enviado' | 'descartado' | 'error';
type Propuesta = Firmada & { estado?: Estado };
interface Mensaje { role: 'user' | 'assistant'; content: string; propuestas?: Propuesta[]; adjunto?: Planilla; archivos?: ArchivoIA[] }
interface Charla { id: string; titulo: string; updated_at: string }

function tituloDe(mensajes: Mensaje[]): string {
  const primero = mensajes.find(m => m.role === 'user')?.content.replace(MARCA_FOTO, '').trim() ?? '';
  return primero.slice(0, 60) || 'Charla nueva';
}

const SUGERENCIAS = [
  '¿Qué tengo pendiente hoy?',
  'Quiero cargar un evento nuevo',
  '¿Cómo viene el festival?',
];

/** Lo que se le manda al modelo: el texto de la planilla va solo en la última que se adjuntó. */
function paraModelo(ms: Mensaje[]) {
  const ultima = ms.map(m => !!m.adjunto).lastIndexOf(true);
  return ms.map((m, i) => ({ m, i })).slice(-12).map(({ m, i }) => {
    if (!m.adjunto) return { role: m.role, content: m.content };
    const bloque = i === ultima ? `\n[Archivo: ${m.adjunto.nombre}]\n${m.adjunto.texto}\n[/Archivo]` : `\n[Archivo: ${m.adjunto.nombre} — ya enviado antes]`;
    return { role: m.role, content: m.content + bloque };
  });
}

function BotonArchivo({ archivo }: { archivo: ArchivoIA }) {
  const [bajando, setBajando] = useState(false);
  const [error, setError] = useState(false);
  const Icono = archivo.formato === 'excel' ? FileSpreadsheet : FileText;
  const filas = archivo.hojas.reduce((n, h) => n + h.filas.length, 0);
  return (
    <button type="button" disabled={bajando}
      onClick={async () => {
        setBajando(true); setError(false);
        try { await descargarArchivo(archivo); } catch { setError(true); } finally { setBajando(false); }
      }}
      className="flex w-full max-w-sm items-center gap-3 rounded-xl border border-manso-cream/15 px-4 py-3 text-left hover:bg-manso-cream/5 disabled:opacity-60">
      <Icono size={20} className="shrink-0 text-manso-cream/70" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-bold text-manso-cream">{archivo.nombre}.{archivo.formato === 'excel' ? 'xlsx' : 'pdf'}</span>
        <span className="block text-[12px] text-manso-cream/62">{error ? 'No se pudo armar el archivo. Probá de nuevo.' : `${filas} ${filas === 1 ? 'fila' : 'filas'}`}</span>
      </span>
      {bajando ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Download size={16} aria-hidden />}
    </button>
  );
}


function TarjetaAccion({ item, onEstado }: { item: Propuesta; onEstado: (e: Estado) => void }) {
  const [estado, setEstadoLocal] = useState<Estado>(item.estado === 'enviando' ? 'pendiente' : item.estado ?? 'pendiente');
  const [error, setError] = useState<string | null>(null);
  const esMail = item.accion.tipo === 'mail';
  const setEstado = (e: Estado) => {
    setEstadoLocal(e);
    if (e === 'enviado' || e === 'descartado') onEstado(e);
  };

  const ejecutar = async () => {
    setEstado('enviando');
    setError(null);
    try {
      const res = await fetch('/api/admin/ia/ejecutar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? 'No se pudo completar.');
      setEstado('enviado');
      if (!esMail) window.dispatchEvent(new CustomEvent('dashboardRefresh'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar.');
      setEstado('error');
    }
  };

  const a = item.accion;
  return (
    <div className="rounded-xl border border-manso-cream/15 bg-manso-cream/5 p-4 space-y-2">
      {a.tipo === 'mail' ? (
        <>
          <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-manso-cream/62">
            <Mail size={14} aria-hidden /> Para: <span className="normal-case tracking-normal text-manso-cream">{a.datos.para}</span>
          </p>
          <p className="text-[15px] font-bold text-manso-cream">{a.datos.asunto}</p>
          <p className="whitespace-pre-line text-[14px] leading-relaxed text-manso-cream/85">{a.datos.texto}</p>
        </>
      ) : (
        <>
          <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-manso-cream/62">
            <CalendarPlus size={14} aria-hidden /> Evento nuevo{a.datos.categoria ? ` · ${a.datos.categoria}` : ''}
          </p>
          <div className="flex gap-3">
            {a.datos.imagen_url && <img src={a.datos.imagen_url} alt="" className="h-24 w-24 rounded-lg object-cover" />}
            <div className="space-y-1">
              <p className="text-[16px] font-bold text-manso-cream">{a.datos.titulo}</p>
              <p className="text-[14px] text-manso-cream/85">
                {fechaLinda(a.datos.fecha)}{a.datos.fecha_fin ? ` → ${fechaLinda(a.datos.fecha_fin)}` : ''}
              </p>
              {a.datos.descripcion && <p className="whitespace-pre-line text-[14px] text-manso-cream/75">{a.datos.descripcion}</p>}
              {a.datos.link_tickets && <p className="break-all text-[13px] text-manso-cream/62">{a.datos.link_tickets}</p>}
            </div>
          </div>
        </>
      )}
      {error && <p role="alert" className="text-[13px] text-red-400">{error}</p>}
      {estado === 'enviado' ? (
        <p className="flex items-center gap-2 text-[13px] font-bold text-green-400"><Check size={14} aria-hidden /> {esMail ? 'Enviado' : 'Evento creado'}</p>
      ) : estado === 'descartado' ? (
        <p className="text-[13px] text-manso-cream/62">Descartado</p>
      ) : (
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={ejecutar} disabled={estado === 'enviando'}
            className="flex items-center gap-2 rounded-xl bg-manso-cream px-4 py-2 text-[13px] font-bold uppercase tracking-wider text-manso-black disabled:opacity-40">
            {estado === 'enviando' ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Check size={14} aria-hidden />}
            {estado === 'enviando' ? 'Un momento…' : esMail ? 'Enviar' : 'Crear evento'}
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
  const [foto, setFoto] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [planilla, setPlanilla] = useState<Planilla | null>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const fin = useRef<HTMLDivElement>(null);
  const archivo = useRef<HTMLInputElement>(null);
  const [charlas, setCharlas] = useState<Charla[]>([]);
  const [verCharlas, setVerCharlas] = useState(false);
  const [charlaId, setCharlaId] = useState<string | null>(null);
  // Espejo síncrono: evita crear dos filas si se guarda dos veces seguidas.
  const idRef = useRef<string | null>(null);
  const mensajesRef = useRef<Mensaje[]>([]);

  const cargarLista = async () => {
    const { data } = await supabase.from('ia_conversaciones').select('id, titulo, updated_at').order('updated_at', { ascending: false }).limit(30);
    setCharlas((data as Charla[] | null) ?? []);
    return (data as Charla[] | null) ?? [];
  };

  const abrir = async (id: string) => {
    const { data } = await supabase.from('ia_conversaciones').select('mensajes').eq('id', id).maybeSingle();
    const ms = Array.isArray(data?.mensajes) ? (data.mensajes as Mensaje[]) : [];
    idRef.current = id;
    mensajesRef.current = ms;
    setCharlaId(id);
    setMensajes(ms);
    setError(null);
    setVerCharlas(false);
    setTimeout(() => fin.current?.scrollIntoView(), 50);
  };

  useEffect(() => {
    cargarLista().then(l => { if (l[0] && !idRef.current) abrir(l[0].id); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guardar = async (ms: Mensaje[]) => {
    mensajesRef.current = ms;
    try {
      if (idRef.current) {
        await supabase.from('ia_conversaciones').update({ mensajes: ms, updated_at: new Date().toISOString() }).eq('id', idRef.current);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('ia_conversaciones').insert({ user_id: user.id, titulo: tituloDe(ms), mensajes: ms }).select('id').single();
        if (data) { idRef.current = data.id; setCharlaId(data.id); }
      }
      cargarLista();
    } catch {
      // Guardar es una comodidad: si falla, la charla sigue en pantalla.
    }
  };

  const nuevaCharla = () => {
    idRef.current = null;
    mensajesRef.current = [];
    setCharlaId(null);
    setMensajes([]);
    setError(null);
    setTexto('');
    setFoto(null);
    setPlanilla(null);
    setVerCharlas(false);
  };

  const borrarCharla = async (id: string) => {
    await supabase.from('ia_conversaciones').delete().eq('id', id);
    if (idRef.current === id) nuevaCharla();
    cargarLista();
  };

  const marcarEstado = (i: number, j: number, estado: Estado) => {
    const ms = mensajesRef.current.map((m, k) => k !== i ? m : { ...m, propuestas: m.propuestas?.map((p, l) => l === j ? { ...p, estado } : p) });
    setMensajes(ms);
    guardar(ms);
  };

  const elegirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setSubiendo(true);
    setError(null);
    try {
      if (esPlanilla(f)) {
        setPlanilla(await leerPlanilla(f));
        setFoto(null);
      } else if (f.type.startsWith('image/')) {
        setFoto(await subirFoto(f));
        setPlanilla(null);
      } else {
        throw new Error('Puedo leer fotos, Excel (.xlsx) y CSV. Si es .xls, guardalo como .xlsx.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer el archivo.');
    } finally {
      setSubiendo(false);
    }
  };

  const enviar = async (contenido: string) => {
    const limpio = contenido.trim();
    if ((!limpio && !foto && !planilla) || cargando || subiendo) return;
    const base = limpio || (planilla ? 'Te dejo este archivo.' : 'Te dejo esta foto.');
    const completo = foto ? `${base}\n[Foto adjunta: ${foto}]` : base;
    const nuevos: Mensaje[] = [...mensajesRef.current, { role: 'user', content: completo, ...(planilla ? { adjunto: planilla } : {}) }];
    mensajesRef.current = nuevos;
    setMensajes(nuevos);
    guardar(nuevos);
    setTexto('');
    setFoto(null);
    setPlanilla(null);
    if (campo.current) campo.current.style.height = 'auto';
    setError(null);
    setCargando(true);
    try {
      const res = await fetch('/api/admin/ia/asistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Las propuestas no vuelven al modelo: solo el texto de la charla.
        body: JSON.stringify({ mensajes: paraModelo(nuevos) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? 'No se pudo responder.');
      const conRespuesta: Mensaje[] = [...nuevos, { role: 'assistant', content: data.respuesta, propuestas: data.propuestas, archivos: data.archivos }];
      mensajesRef.current = conRespuesta;
      setMensajes(conRespuesta);
      guardar(conRespuesta);
      setTimeout(() => fin.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo responder.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col gap-6">
      <header className="flex items-center gap-2">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-manso-cream">Asistente</h2>
        <div className="ml-auto flex shrink-0 gap-1">
          <button type="button" onClick={() => setVerCharlas(v => !v)} aria-expanded={verCharlas}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-bold uppercase tracking-wider text-manso-cream/70 hover:bg-manso-cream/10">
            <History size={14} aria-hidden /> Charlas
          </button>
          <button type="button" onClick={nuevaCharla} disabled={mensajes.length === 0}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-bold uppercase tracking-wider text-manso-cream/70 hover:bg-manso-cream/10 disabled:opacity-40">
            <Plus size={14} aria-hidden /> Nueva
          </button>
        </div>
      </header>

      {verCharlas && (
        <ul className="space-y-1 rounded-xl border border-manso-cream/15 p-2">
          {charlas.length === 0 && <li className="px-3 py-2 text-[14px] text-manso-cream/62">Todavía no hay charlas guardadas.</li>}
          {charlas.map(c => (
            <li key={c.id} className="flex items-center gap-2">
              <button type="button" onClick={() => abrir(c.id)}
                className={`flex-1 truncate rounded-lg px-3 py-2 text-left text-[14px] hover:bg-manso-cream/10 ${c.id === charlaId ? 'bg-manso-cream/10 text-manso-cream' : 'text-manso-cream/85'}`}>
                {c.titulo}
                <span className="ml-2 text-[12px] text-manso-cream/50">{new Date(c.updated_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
              </button>
              <button type="button" onClick={() => borrarCharla(c.id)} aria-label={`Borrar la charla ${c.titulo}`} title="Borrar"
                className="rounded-lg p-2 text-manso-cream/62 hover:bg-manso-cream/10 hover:text-red-400">
                <Trash2 size={14} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {mensajes.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 py-10 text-center">
          <p className="text-2xl font-bold text-manso-cream">¿En qué te ayudo?</p>
          <div className="flex flex-col items-center gap-1">
            {SUGERENCIAS.map(s => (
              <button key={s} type="button" onClick={() => enviar(s)}
                className="rounded-lg px-3 py-1.5 text-[15px] text-manso-cream/70 underline-offset-4 hover:text-manso-cream hover:underline">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-5" aria-live="polite">
        {mensajes.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'space-y-3'}>
            {m.role === 'user' ? (
              <div className="max-w-[85%] space-y-2 rounded-2xl bg-manso-cream px-4 py-2.5 text-[15px] text-manso-black">
                <p className="whitespace-pre-line">{m.content.replace(MARCA_FOTO, '')}</p>
                {m.adjunto && <p className="flex items-center gap-2 text-[13px] text-manso-black/70"><FileSpreadsheet size={14} aria-hidden /> {m.adjunto.nombre}</p>}
                {MARCA_FOTO.exec(m.content) && <img src={MARCA_FOTO.exec(m.content)![1]} alt="Foto adjunta" className="h-24 rounded-lg object-cover" />}
              </div>
            ) : (
              <>
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-manso-cream">{m.content}</p>
                {m.archivos?.map((a, j) => <BotonArchivo key={`${i}-a${j}`} archivo={a} />)}
                {m.propuestas?.map((p, j) => <TarjetaAccion key={`${i}-${j}-${p.firma}`} item={p} onEstado={e => marcarEstado(i, j, e)} />)}
              </>
            )}
          </div>
        ))}
        {cargando && <p className="flex items-center gap-2 text-[14px] text-manso-cream/70"><Loader2 size={14} className="animate-spin" aria-hidden /> Un momento…</p>}
        {error && <p role="alert" className="text-[14px] text-red-400">{error}</p>}
        <div ref={fin} />
      </div>

      <div className="sticky bottom-0 mt-auto space-y-2 bg-manso-black pb-2 pt-2">
        {(foto || subiendo || planilla) && (
          <div className="flex items-center gap-3 text-[13px] text-manso-cream/80">
            {subiendo ? <><Loader2 size={14} className="animate-spin" aria-hidden /> Leyendo el archivo…</> : planilla ? (
              <>
                <FileSpreadsheet size={16} aria-hidden />
                <span className="truncate">{planilla.nombre}{planilla.recortado ? ' (muy largo: leo las primeras filas)' : ''}</span>
                <button type="button" onClick={() => setPlanilla(null)} className="underline">Quitar</button>
              </>
            ) : (
              <>
                <img src={foto!} alt="Foto lista para enviar" className="h-12 w-12 rounded-lg object-cover" />
                <span>Foto lista. Contame para qué es.</span>
                <button type="button" onClick={() => setFoto(null)} className="underline">Quitar</button>
              </>
            )}
          </div>
        )}
        <form onSubmit={e => { e.preventDefault(); enviar(texto); }}
          className="flex items-end gap-2 rounded-2xl border border-manso-cream/15 bg-manso-cream/5 p-2 focus-within:border-manso-cream/40">
          <input ref={archivo} type="file" accept="image/*,.xlsx,.csv" className="hidden" onChange={elegirFoto} />
          <button type="button" onClick={() => archivo.current?.click()} disabled={subiendo} aria-label="Adjuntar foto o Excel" title="Adjuntar foto, Excel o CSV"
            className="rounded-xl p-2.5 text-manso-cream/70 hover:bg-manso-cream/10 disabled:opacity-40">
            <Paperclip size={18} aria-hidden />
          </button>
          <textarea
            ref={campo}
            rows={1}
            value={texto}
            onChange={e => {
              setTexto(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
            }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); enviar(texto); } }}
            maxLength={2000}
            placeholder="Escribile al asistente…"
            aria-label="Mensaje para el asistente"
            className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] text-manso-cream placeholder:text-manso-cream/50 focus:outline-none"
          />
          <button type="submit" disabled={cargando || subiendo || (!texto.trim() && !foto && !planilla)} aria-label="Enviar"
            className="rounded-xl bg-manso-cream p-2.5 text-manso-black disabled:opacity-30">
            <ArrowUp size={18} aria-hidden />
          </button>
        </form>
      </div>
    </div>
  );
}
