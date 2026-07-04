'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, Trash2, Ban, X, ShieldOff, MessagesSquare, ChevronDown, ChevronUp } from 'lucide-react';

interface Reporte {
  id: string;
  thread_id: string | null;
  reply_id: string | null;
  motivo: string;
  created_at: string;
  reportado_por: string;
}

interface ContenidoReportado {
  autor_id: string;
  autor_nombre: string | null;
  texto: string;
  threadIdParaLink: string;
}

// Un reporte apunta a un thread O a una reply, nunca ambos (constraint de la tabla)
function contenidoKey(reporte: Pick<Reporte, 'thread_id' | 'reply_id'>) {
  return reporte.thread_id ?? reporte.reply_id!;
}

interface UsuarioBaneado {
  id: string;
  email: string;
  display_name: string | null;
  foro_baneado_motivo: string | null;
  foro_baneado_at: string | null;
}

interface ThreadResumen {
  id: string;
  titulo: string;
  autor_id: string;
  autor_nombre: string | null;
  created_at: string;
  reply_count: number;
}

interface ReplyResumen {
  id: string;
  thread_id: string;
  cuerpo: string;
  autor_id: string;
  autor_nombre: string | null;
  created_at: string;
}

export function ModeracionForo() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [contenidos, setContenidos] = useState<Record<string, ContenidoReportado>>({});
  const [baneados, setBaneados] = useState<UsuarioBaneado[]>([]);
  const [todosThreads, setTodosThreads] = useState<ThreadResumen[]>([]);
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [repliesPorThread, setRepliesPorThread] = useState<Record<string, ReplyResumen[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchTodo = useCallback(async () => {
    setLoading(true);

    const { data: reportesData } = await supabase
      .from('foro_reportes')
      .select('id, thread_id, reply_id, motivo, created_at, reportado_por')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: true });

    setReportes(reportesData ?? []);

    const threadIds = (reportesData ?? []).filter(r => r.thread_id).map(r => r.thread_id!) as string[];
    const replyIds = (reportesData ?? []).filter(r => r.reply_id).map(r => r.reply_id!) as string[];

    const contenidoMap: Record<string, ContenidoReportado> = {};

    if (threadIds.length > 0) {
      const { data: threads } = await supabase
        .from('foro_threads')
        .select('id, titulo, cuerpo, autor_id, autor_nombre')
        .in('id', threadIds);
      for (const t of threads ?? []) {
        contenidoMap[t.id] = {
          autor_id: t.autor_id,
          autor_nombre: t.autor_nombre,
          texto: `${t.titulo} — ${t.cuerpo}`,
          threadIdParaLink: t.id,
        };
      }
    }

    if (replyIds.length > 0) {
      const { data: replies } = await supabase
        .from('foro_replies')
        .select('id, thread_id, cuerpo, autor_id, autor_nombre')
        .in('id', replyIds);
      for (const r of replies ?? []) {
        contenidoMap[r.id] = {
          autor_id: r.autor_id,
          autor_nombre: r.autor_nombre,
          texto: r.cuerpo,
          threadIdParaLink: r.thread_id,
        };
      }
    }

    setContenidos(contenidoMap);

    const { data: baneadosData } = await supabase
      .from('user_profiles')
      .select('id, email, display_name, foro_baneado_motivo, foro_baneado_at')
      .eq('foro_baneado', true);

    setBaneados(baneadosData ?? []);

    const { data: threadsData } = await supabase
      .from('foro_threads')
      .select('id, titulo, autor_id, autor_nombre, created_at, reply_count')
      .order('created_at', { ascending: false });

    setTodosThreads(threadsData ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTodo(); }, [fetchTodo]);

  const toggleExpandThread = async (threadId: string) => {
    if (expandedThreadId === threadId) {
      setExpandedThreadId(null);
      return;
    }
    setExpandedThreadId(threadId);
    if (!repliesPorThread[threadId]) {
      const { data } = await supabase
        .from('foro_replies')
        .select('id, thread_id, cuerpo, autor_id, autor_nombre, created_at')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      setRepliesPorThread(prev => ({ ...prev, [threadId]: data ?? [] }));
    }
  };

  const borrarThreadCompleto = async (threadId: string) => {
    if (!confirm('¿Borrar este thread completo? Se borrarán también sus respuestas.')) return;
    const { error } = await supabase.from('foro_threads').delete().eq('id', threadId);
    if (error) { alert(error.message); return; }
    setTodosThreads(prev => prev.filter(t => t.id !== threadId));
    if (expandedThreadId === threadId) setExpandedThreadId(null);
  };

  const borrarReplyIndividual = async (replyId: string, threadId: string) => {
    if (!confirm('¿Borrar esta respuesta?')) return;
    const { error } = await supabase.from('foro_replies').delete().eq('id', replyId);
    if (error) { alert(error.message); return; }
    setRepliesPorThread(prev => ({
      ...prev,
      [threadId]: (prev[threadId] ?? []).filter(r => r.id !== replyId),
    }));
    setTodosThreads(prev =>
      prev.map(t => (t.id === threadId ? { ...t, reply_count: Math.max(0, t.reply_count - 1) } : t))
    );
  };

  const quitarReporte = (id: string) => setReportes(prev => prev.filter(r => r.id !== id));

  const descartar = async (id: string) => {
    const { error } = await supabase.from('foro_reportes').update({ estado: 'descartado' }).eq('id', id);
    if (error) { alert(error.message); return; }
    quitarReporte(id);
  };

  const borrarContenido = async (reporte: Reporte) => {
    if (!confirm('¿Borrar este contenido del foro?')) return;
    const table = reporte.thread_id ? 'foro_threads' : 'foro_replies';
    const id = contenidoKey(reporte);
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) { alert(error.message); return; }
    await supabase.from('foro_reportes').update({ estado: 'resuelto' }).eq('id', reporte.id);
    quitarReporte(reporte.id);
    setContenidos(prev => Object.fromEntries(Object.entries(prev).filter(([k]) => k !== id)));
  };

  const banear = async (autorId: string, reporteId: string) => {
    const motivo = prompt('Motivo del baneo (visible solo para el equipo):');
    if (motivo === null) return;
    const foroBaneadoAt = new Date().toISOString();
    const { data: usuario, error } = await supabase
      .from('user_profiles')
      .update({ foro_baneado: true, foro_baneado_motivo: motivo, foro_baneado_at: foroBaneadoAt })
      .eq('id', autorId)
      .select('id, email, display_name, foro_baneado_motivo, foro_baneado_at')
      .single();
    if (error) { alert(error.message); return; }
    await supabase.from('foro_reportes').update({ estado: 'resuelto' }).eq('id', reporteId);
    quitarReporte(reporteId);
    setBaneados(prev => [...prev, usuario]);
  };

  const desbanear = async (id: string) => {
    if (!confirm('¿Desbanear a este usuario del foro?')) return;
    const { error } = await supabase
      .from('user_profiles')
      .update({ foro_baneado: false, foro_baneado_motivo: null, foro_baneado_at: null })
      .eq('id', id);
    if (error) { alert(error.message); return; }
    setBaneados(prev => prev.filter(u => u.id !== id));
  };

  if (loading) {
    return <p className="text-manso-cream/40 text-xs text-center py-12">Cargando moderación...</p>;
  }

  return (
    <div className="space-y-8">
      {/* Reportes pendientes */}
      <div className="bg-manso-cream/5 rounded-[2.5rem] border border-manso-cream/10 p-8">
        <h3 className="text-lg font-black uppercase tracking-tighter text-manso-cream mb-6 flex items-center gap-2">
          <ShieldAlert size={18} className="text-manso-terra" />
          Reportes pendientes ({reportes.length})
        </h3>

        {reportes.length === 0 ? (
          <p className="text-manso-cream/30 text-xs text-center py-8 uppercase tracking-widest font-black">
            Sin reportes pendientes
          </p>
        ) : (
          <div className="space-y-3">
            {reportes.map(rep => {
              const contenido = contenidos[contenidoKey(rep)];
              return (
                <div key={rep.id} className="bg-manso-cream/5 rounded-2xl border border-manso-cream/10 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-manso-cream text-xs font-bold">
                        {rep.thread_id ? 'Thread' : 'Respuesta'} de {contenido?.autor_nombre ?? 'Usuario'}
                      </p>
                      <p className="text-manso-cream/50 text-xs line-clamp-2 mt-1">{contenido?.texto ?? '(contenido eliminado)'}</p>
                    </div>
                    <a
                      href={contenido ? `/foro/${contenido.threadIdParaLink}` : '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-manso-terra text-[10px] uppercase tracking-widest shrink-0 hover:underline"
                    >
                      Ver
                    </a>
                  </div>
                  <p className="text-manso-cream/40 text-[11px] mb-3">
                    <span className="font-bold uppercase tracking-widest">Motivo:</span> {rep.motivo}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => descartar(rep.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-manso-cream/10 text-manso-cream/70 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-manso-cream/20 transition-all"
                    >
                      <X size={12} />
                      Descartar
                    </button>
                    <button
                      onClick={() => borrarContenido(rep)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-manso-terra/10 text-manso-terra rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-manso-terra/20 transition-all"
                    >
                      <Trash2 size={12} />
                      Borrar contenido
                    </button>
                    {contenido && (
                      <button
                        onClick={() => banear(contenido.autor_id, rep.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-manso-terra text-manso-cream rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-manso-terra/80 transition-all"
                      >
                        <Ban size={12} />
                        Banear autor
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Todo el contenido */}
      <div className="bg-manso-cream/5 rounded-[2.5rem] border border-manso-cream/10 p-8">
        <h3 className="text-lg font-black uppercase tracking-tighter text-manso-cream mb-6 flex items-center gap-2">
          <MessagesSquare size={18} className="text-manso-terra" />
          Todo el contenido ({todosThreads.length})
        </h3>

        {todosThreads.length === 0 ? (
          <p className="text-manso-cream/30 text-xs text-center py-8 uppercase tracking-widest font-black">
            Sin threads en el foro
          </p>
        ) : (
          <div className="space-y-3">
            {todosThreads.map(thread => {
              const expandido = expandedThreadId === thread.id;
              const replies = repliesPorThread[thread.id] ?? [];
              return (
                <div key={thread.id} className="bg-manso-cream/5 rounded-2xl border border-manso-cream/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-manso-cream text-xs font-bold truncate">{thread.titulo}</p>
                      <p className="text-manso-cream/40 text-[11px] mt-0.5">
                        {thread.autor_nombre ?? 'Usuario'} · {thread.reply_count} {thread.reply_count === 1 ? 'respuesta' : 'respuestas'}
                      </p>
                    </div>
                    <a
                      href={`/foro/${thread.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-manso-terra text-[10px] uppercase tracking-widest shrink-0 hover:underline"
                    >
                      Ver
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() => toggleExpandThread(thread.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-manso-cream/10 text-manso-cream/70 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-manso-cream/20 transition-all"
                    >
                      {expandido ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {expandido ? 'Ocultar respuestas' : 'Ver respuestas'}
                    </button>
                    <button
                      onClick={() => borrarThreadCompleto(thread.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-manso-terra/10 text-manso-terra rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-manso-terra/20 transition-all"
                    >
                      <Trash2 size={12} />
                      Borrar thread
                    </button>
                  </div>

                  {expandido && (
                    <div className="mt-3 pl-4 border-l-2 border-manso-cream/10 space-y-2">
                      {replies.length === 0 ? (
                        <p className="text-manso-cream/30 text-[11px] py-2">Sin respuestas</p>
                      ) : (
                        replies.map(reply => (
                          <div key={reply.id} className="flex items-start justify-between gap-3 bg-manso-cream/5 rounded-xl px-3 py-2">
                            <div className="min-w-0">
                              <p className="text-manso-cream/70 text-[11px] font-bold">{reply.autor_nombre ?? 'Usuario'}</p>
                              <p className="text-manso-cream/50 text-[11px] line-clamp-2 mt-0.5">{reply.cuerpo}</p>
                            </div>
                            <button
                              onClick={() => borrarReplyIndividual(reply.id, thread.id)}
                              className="flex items-center gap-1 px-2 py-1 bg-manso-terra/10 text-manso-terra rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-manso-terra/20 transition-all shrink-0"
                            >
                              <Trash2 size={11} />
                              Borrar
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Usuarios baneados */}
      <div className="bg-manso-cream/5 rounded-[2.5rem] border border-manso-cream/10 p-8">
        <h3 className="text-lg font-black uppercase tracking-tighter text-manso-cream mb-6 flex items-center gap-2">
          <ShieldOff size={18} className="text-manso-terra" />
          Usuarios baneados del foro ({baneados.length})
        </h3>

        {baneados.length === 0 ? (
          <p className="text-manso-cream/30 text-xs text-center py-8 uppercase tracking-widest font-black">
            Sin usuarios baneados
          </p>
        ) : (
          <div className="space-y-2">
            {baneados.map(u => (
              <div key={u.id} className="flex items-center justify-between gap-3 bg-manso-cream/5 rounded-2xl px-4 py-3 border border-manso-cream/10">
                <div className="min-w-0">
                  <p className="text-manso-cream text-xs font-bold">{u.display_name ?? u.email}</p>
                  {u.foro_baneado_motivo && <p className="text-manso-cream/40 text-[11px] mt-0.5">{u.foro_baneado_motivo}</p>}
                </div>
                <button
                  onClick={() => desbanear(u.id)}
                  className="px-3 py-1.5 bg-manso-cream/10 text-manso-cream/70 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-manso-cream/20 transition-all shrink-0"
                >
                  Desbanear
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
