'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Eraser, Hash, KeyRound, Lock, MessageSquare, RefreshCw, Trash2, UserX, Users, VolumeX } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatearClave } from '@/lib/chat-utils';
import type { ChatSalaAdmin } from '@/lib/types/chat';

interface Silenciable {
  id: string;
  display_name: string | null;
  email: string;
  chat_baneado: boolean;
}

interface Miembro {
  user_id: string;
  nombre: string;
}

const card = 'bg-manso-cream/5 border border-manso-cream/10 rounded-[2rem] p-5 sm:p-6';
const input =
  'w-full bg-manso-cream/5 border border-manso-cream/10 rounded-xl px-4 py-3 text-sm text-manso-cream placeholder:text-manso-cream/30 focus:outline-none focus:border-manso-terra/50 transition-colors';
const boton =
  'px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40';
const titulo = 'text-[10px] font-black uppercase tracking-[0.2em] text-manso-cream/50 mb-4';

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

/** Texto listo para pegar en WhatsApp */
const invitacion = (nombre: string, clave: string) =>
  `Te sumo a la sala privada "${nombre}" de Manso Chat.\n1) Entrá a mansoclub.com.ar/mansochat\n2) Tocá la llave 🔑\n3) Ingresá la clave: ${formatearClave(clave)}`;

function BotonCopiar({ texto, etiqueta }: { texto: string; etiqueta: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        if (await copiar(texto)) {
          setOk(true);
          setTimeout(() => setOk(false), 1600);
        }
      }}
      className={`${boton} flex items-center gap-1.5 bg-manso-cream/10 text-manso-cream hover:bg-manso-cream/20`}
    >
      {ok ? <Check size={12} /> : <Copy size={12} />}
      {ok ? 'Copiado' : etiqueta}
    </button>
  );
}

export function ChatAdmin() {
  const [salas, setSalas] = useState<ChatSalaAdmin[]>([]);
  const [retencion, setRetencion] = useState('30');
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [cargando, setCargando] = useState(true);

  // crear privada
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [claveCustom, setClaveCustom] = useState('');
  const [creada, setCreada] = useState<{ nombre: string; clave: string } | null>(null);

  // silenciados
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<Silenciable[]>([]);
  const [silenciados, setSilenciados] = useState<Silenciable[]>([]);

  const avisar = (tipo: 'ok' | 'error', texto: string) => {
    setAviso({ tipo, texto: texto.replace(/^.*?:\s*/, '') });
    setTimeout(() => setAviso(null), 4000);
  };

  const cargar = useCallback(async () => {
    const [{ data: s, error }, { data: cfg }, { data: sil }] = await Promise.all([
      supabase.rpc('chat_admin_salas'),
      supabase.from('chat_config').select('retencion_dias').maybeSingle(),
      supabase
        .from('user_profiles')
        .select('id, display_name, email, chat_baneado')
        .eq('chat_baneado', true)
        .order('display_name'),
    ]);
    if (error) setAviso({ tipo: 'error', texto: 'No se pudieron cargar las salas' });
    setSalas((s ?? []) as ChatSalaAdmin[]);
    if (cfg?.retencion_dias) setRetencion(String(cfg.retencion_dias));
    setSilenciados((sil ?? []) as Silenciable[]);
    setCargando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial: el estado cambia recién al responder la base
    void cargar();
  }, [cargar]);

  useEffect(() => {
    const q = busqueda.trim();
    if (q.length < 2) return;
    const t = setTimeout(async () => {
      const literal = q.replace(/[\\%_,()]/g, c => `\\${c}`);
      const { data } = await supabase
        .from('user_profiles')
        .select('id, display_name, email, chat_baneado')
        .or(`display_name.ilike.%${literal}%,email.ilike.%${literal}%`)
        .limit(6);
      setResultados((data ?? []) as Silenciable[]);
    }, 250);
    return () => clearTimeout(t);
  }, [busqueda]);

  async function crearPrivada(e: React.FormEvent) {
    e.preventDefault();
    const { data, error } = await supabase.rpc('chat_admin_crear_privada', {
      p_nombre: nombre,
      p_descripcion: descripcion || null,
      p_clave: claveCustom || null,
    });
    if (error) return avisar('error', error.message);
    setCreada({ nombre: nombre.trim(), clave: (data as { clave: string }).clave });
    setNombre('');
    setDescripcion('');
    setClaveCustom('');
    void cargar();
  }

  async function guardarRetencionGlobal() {
    const dias = parseInt(retencion, 10);
    if (!dias || dias < 1) return avisar('error', 'Poné un número de días válido');
    const { error } = await supabase.rpc('chat_admin_config_set', { p_dias: dias });
    if (error) avisar('error', error.message);
    else avisar('ok', `Los mensajes se borran a los ${dias} días`);
  }

  async function limpiarAhora() {
    const { data, error } = await supabase.rpc('chat_admin_purgar');
    if (error) return avisar('error', error.message);
    avisar('ok', data === 0 ? 'No había mensajes para borrar' : `Se borraron ${data} mensajes viejos`);
    void cargar();
  }

  async function silenciar(u: Silenciable, valor: boolean) {
    const { error } = await supabase.rpc('chat_admin_silenciar', { p_user: u.id, p_silenciar: valor });
    if (error) return avisar('error', error.message);
    setBusqueda('');
    avisar('ok', valor ? `${u.display_name ?? u.email} ya no puede escribir` : `${u.display_name ?? u.email} puede escribir otra vez`);
    void cargar();
  }

  return (
    <div className="space-y-6">
      {aviso && (
        <p
          role="status"
          className={`rounded-xl px-4 py-3 text-xs font-bold ${
            aviso.tipo === 'ok' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-manso-terra/20 text-manso-cream'
          }`}
        >
          {aviso.texto}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Borrado automático */}
        <section className={card}>
          <h2 className={titulo}>Borrado automático</h2>
          <p className="mb-4 text-xs leading-relaxed text-manso-cream/60">
            Todos los días a las 4 AM se borran los mensajes más viejos que este límite (con sus reacciones). Cada sala puede
            tener su propio límite más abajo; si no, usa este.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={3650}
              value={retencion}
              onChange={e => setRetencion(e.target.value)}
              className={`${input} max-w-[7rem]`}
              aria-label="Días de retención"
            />
            <span className="text-xs text-manso-cream/60">días</span>
            <button onClick={guardarRetencionGlobal} className={`${boton} bg-manso-terra text-manso-cream hover:bg-manso-terra/90`}>
              Guardar
            </button>
            <button
              onClick={limpiarAhora}
              className={`${boton} ml-auto flex items-center gap-1.5 bg-manso-cream/10 text-manso-cream hover:bg-manso-cream/20`}
              title="Borra ahora lo que ya superó el límite"
            >
              <Eraser size={12} /> Limpiar ahora
            </button>
          </div>
        </section>

        {/* Crear privada */}
        <section className={card}>
          <h2 className={titulo}>Nueva sala privada</h2>
          <form onSubmit={crearPrivada} className="space-y-3">
            <input value={nombre} onChange={e => setNombre(e.target.value)} required maxLength={40} placeholder="Nombre de la sala" className={input} />
            <input value={descripcion} onChange={e => setDescripcion(e.target.value)} maxLength={120} placeholder="Descripción (opcional)" className={input} />
            <input
              value={claveCustom}
              onChange={e => setClaveCustom(e.target.value)}
              placeholder="Clave propia (vacío = se genera una segura)"
              autoComplete="off"
              className={`${input} font-mono uppercase tracking-wider`}
            />
            <button type="submit" className={`${boton} flex items-center gap-2 bg-manso-terra text-manso-cream hover:bg-manso-terra/90`}>
              <Lock size={12} /> Crear sala
            </button>
          </form>

          {creada && (
            <div className="mt-4 rounded-2xl border border-manso-olive/40 bg-manso-olive/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-manso-olive">Sala creada: {creada.nombre}</p>
              <p className="my-2 break-all font-mono text-xl font-black tracking-widest text-manso-cream">{formatearClave(creada.clave)}</p>
              <div className="flex flex-wrap gap-2">
                <BotonCopiar texto={creada.clave} etiqueta="Copiar clave" />
                <BotonCopiar texto={invitacion(creada.nombre, creada.clave)} etiqueta="Copiar invitación" />
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Salas */}
      <section>
        <h2 className={titulo}>Salas ({salas.length})</h2>
        {cargando && <p className="text-xs text-manso-cream/50">Cargando…</p>}
        <div className="space-y-3">
          {salas.map(s => (
            <SalaCard key={s.id} sala={s} retencionGlobal={retencion} onCambio={cargar} avisar={avisar} />
          ))}
        </div>
      </section>

      {/* Silenciados */}
      <section className={card}>
        <h2 className={titulo}>Moderación de personas</h2>
        <p className="mb-3 text-xs text-manso-cream/60">
          Una persona silenciada sigue leyendo pero no puede escribir, reaccionar ni crear salas. Los mensajes de cualquiera se
          borran desde el propio chat (siendo admin).
        </p>
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre o mail" className={`${input} mb-3`} />
        {busqueda.trim().length >= 2 && resultados.length > 0 && (
          <ul className="mb-4 divide-y divide-manso-cream/10 rounded-xl border border-manso-cream/10">
            {resultados.map(u => (
              <li key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="min-w-0 flex-1 truncate text-sm text-manso-cream">
                  {u.display_name ?? 'Sin nombre'} <span className="text-manso-cream/40">· {u.email}</span>
                </span>
                <button
                  onClick={() => silenciar(u, !u.chat_baneado)}
                  className={`${boton} ${u.chat_baneado ? 'bg-manso-cream/10 text-manso-cream' : 'bg-manso-terra/80 text-manso-cream'}`}
                >
                  {u.chat_baneado ? 'Dar voz' : 'Silenciar'}
                </button>
              </li>
            ))}
          </ul>
        )}
        <h3 className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-manso-cream/50">
          <VolumeX size={12} /> Silenciadas ahora ({silenciados.length})
        </h3>
        {silenciados.length === 0 ? (
          <p className="text-xs text-manso-cream/40">Nadie.</p>
        ) : (
          <ul className="space-y-1.5">
            {silenciados.map(u => (
              <li key={u.id} className="flex items-center gap-3 text-sm text-manso-cream">
                <span className="min-w-0 flex-1 truncate">{u.display_name ?? u.email}</span>
                <button onClick={() => silenciar(u, false)} className={`${boton} bg-manso-cream/10 hover:bg-manso-cream/20`}>
                  Dar voz
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SalaCard({
  sala,
  retencionGlobal,
  onCambio,
  avisar,
}: {
  sala: ChatSalaAdmin;
  retencionGlobal: string;
  onCambio: () => void;
  avisar: (t: 'ok' | 'error', m: string) => void;
}) {
  const [nombre, setNombre] = useState(sala.nombre);
  const [descripcion, setDescripcion] = useState(sala.descripcion ?? '');
  const [retencion, setRetencion] = useState(sala.retencion_dias ? String(sala.retencion_dias) : '');
  const [miembros, setMiembros] = useState<Miembro[] | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [claveNueva, setClaveNueva] = useState('');

  const privada = sala.tipo === 'privada';
  const Icono = privada ? Lock : Hash;
  const sucio =
    nombre !== sala.nombre || descripcion !== (sala.descripcion ?? '') || retencion !== (sala.retencion_dias ? String(sala.retencion_dias) : '');

  async function guardar() {
    const dias = retencion.trim() === '' ? null : parseInt(retencion, 10);
    if (dias !== null && (!dias || dias < 1)) return avisar('error', 'Los días tienen que ser un número positivo');
    const { error } = await supabase.rpc('chat_admin_sala_set', {
      p_sala: sala.id,
      p_nombre: nombre,
      p_descripcion: descripcion || null,
      p_retencion: dias,
    });
    if (error) avisar('error', error.message);
    else {
      avisar('ok', 'Sala actualizada');
      onCambio();
    }
  }

  async function regenerar() {
    const { error } = await supabase.rpc('chat_admin_regenerar_clave', { p_sala: sala.id, p_clave: claveNueva || null });
    if (error) return avisar('error', error.message);
    setClaveNueva('');
    avisar('ok', 'Clave nueva. Quienes ya entraron siguen adentro.');
    onCambio();
  }

  async function verMiembros() {
    if (miembros) return setMiembros(null);
    const { data } = await supabase.rpc('chat_admin_miembros', { p_sala: sala.id });
    setMiembros((data ?? []) as Miembro[]);
  }

  async function expulsar(m: Miembro) {
    const { error } = await supabase.rpc('chat_admin_expulsar', { p_sala: sala.id, p_user: m.user_id });
    if (error) return avisar('error', error.message);
    setMiembros(prev => prev?.filter(x => x.user_id !== m.user_id) ?? null);
    onCambio();
  }

  async function eliminar() {
    const { error } = await supabase.rpc('chat_eliminar_sala', { p_sala: sala.id });
    if (error) avisar('error', error.message);
    else {
      avisar('ok', 'Sala eliminada');
      onCambio();
    }
  }

  return (
    <article className={card}>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-manso-cream/10 text-manso-cream">
          <Icono size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-black uppercase tracking-wide text-manso-cream">{sala.nombre}</h3>
          <p className="text-[11px] text-manso-cream/50">
            {sala.tipo === 'general' ? 'General' : privada ? 'Privada' : 'Pública'} · {sala.mensajes} mensajes
            {privada && <> · {sala.miembros} miembros</>}
          </p>
        </div>
        {privada && (
          <button onClick={verMiembros} className={`${boton} flex items-center gap-1.5 bg-manso-cream/10 text-manso-cream hover:bg-manso-cream/20`}>
            <Users size={12} /> Miembros
          </button>
        )}
      </div>

      {privada && sala.clave && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-manso-black/40 px-4 py-3">
          <KeyRound size={14} className="text-manso-olive" />
          <span className="font-mono text-sm font-black tracking-widest text-manso-cream">{formatearClave(sala.clave)}</span>
          <span className="ml-auto flex flex-wrap gap-2">
            <BotonCopiar texto={sala.clave} etiqueta="Clave" />
            <BotonCopiar texto={invitacion(sala.nombre, sala.clave)} etiqueta="Invitación" />
          </span>
          <div className="flex w-full gap-2 pt-1">
            <input
              value={claveNueva}
              onChange={e => setClaveNueva(e.target.value)}
              placeholder="Clave nueva (vacío = generar)"
              autoComplete="off"
              className={`${input} py-2 font-mono text-xs uppercase`}
            />
            <button onClick={regenerar} className={`${boton} flex shrink-0 items-center gap-1.5 bg-manso-cream/10 text-manso-cream hover:bg-manso-cream/20`}>
              <RefreshCw size={12} /> Cambiar
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_7rem]">
        <input value={nombre} onChange={e => setNombre(e.target.value)} maxLength={40} aria-label="Nombre" className={`${input} py-2`} />
        <input value={descripcion} onChange={e => setDescripcion(e.target.value)} maxLength={120} placeholder="Descripción" aria-label="Descripción" className={`${input} py-2`} />
        <input
          type="number"
          min={1}
          value={retencion}
          onChange={e => setRetencion(e.target.value)}
          placeholder={`${retencionGlobal} d`}
          aria-label="Días de retención (vacío = global)"
          title="Días antes de borrar los mensajes. Vacío usa el límite global."
          className={`${input} py-2`}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={guardar} disabled={!sucio} className={`${boton} bg-manso-terra text-manso-cream hover:bg-manso-terra/90`}>
          Guardar cambios
        </button>
        {sala.tipo !== 'general' && (
          <button
            onClick={() => (confirmar ? eliminar() : setConfirmar(true))}
            onBlur={() => setConfirmar(false)}
            className={`${boton} ml-auto flex items-center gap-1.5 ${confirmar ? 'bg-manso-terra text-manso-cream' : 'bg-manso-cream/10 text-manso-cream/70 hover:text-manso-cream'}`}
          >
            <Trash2 size={12} /> {confirmar ? 'Confirmar: se pierden los mensajes' : 'Eliminar'}
          </button>
        )}
      </div>

      {miembros && (
        <ul className="mt-4 divide-y divide-manso-cream/10 rounded-xl border border-manso-cream/10">
          {miembros.length === 0 && <li className="px-4 py-3 text-xs text-manso-cream/50">Sin miembros.</li>}
          {miembros.map(m => (
            <li key={m.user_id} className="flex items-center gap-3 px-4 py-2 text-sm text-manso-cream">
              <MessageSquare size={13} className="text-manso-cream/40" />
              <span className="min-w-0 flex-1 truncate">{m.nombre}</span>
              <button onClick={() => expulsar(m)} className={`${boton} flex items-center gap-1.5 bg-manso-cream/10 py-1.5 hover:bg-manso-terra/80`}>
                <UserX size={12} /> Sacar
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
